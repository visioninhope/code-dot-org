class Api::V1::Pd::ApplicationsController < ::ApplicationController
  load_and_authorize_resource class: 'Pd::Application::ApplicationBase'

  # Api::CsvDownload must be included after load_and_authorize_resource so the auth callback runs first
  include Api::CsvDownload
  include Pd::Application::ApplicationConstants

  REGIONAL_PARTNERS_ALL = "all"
  REGIONAL_PARTNERS_NONE = "none"

  # GET /api/v1/pd/applications?regional_partner_filter=:regional_partner_filter
  # :regional_partner_filter can be "all", "none", or a regional_partner_id
  def index
    regional_partner_filter = params[:regional_partner_filter]
    application_data = empty_application_data

    ROLES.each do |role|
      # count(locked_at) counts the non-null values in the locked_at column
      apps = get_applications_by_role(role).
        select(:status, "count(locked_at) AS locked, count(id) AS total").
          group(:status)

      if regional_partner_filter == REGIONAL_PARTNERS_NONE
        apps = apps.where(regional_partner_id: nil)
      elsif regional_partner_filter && regional_partner_filter != REGIONAL_PARTNERS_ALL
        apps = apps.where(regional_partner_id: regional_partner_filter)
      end

      apps.group(:status).each do |group|
        application_data[role][group.status] = {
          locked: group.locked,
          unlocked: group.total - group.locked
        }
      end
    end

    render json: application_data
  end

  # GET /api/v1/pd/applications/1
  def show
    serialized_application = Api::V1::Pd::ApplicationSerializer.new(
      @application,
      scope: {raw_form_data: params[:raw_form_data]}
    ).attributes

    render json: serialized_application
  end

  # GET /api/v1/pd/applications/quick_view?role=:role
  def quick_view
    role = params[:role].to_sym
    applications = get_applications_by_role(role)

    unless params[:regional_partner_filter].blank? || params[:regional_partner_filter] == 'all'
      applications = applications.where(regional_partner_id: params[:regional_partner_filter] == 'none' ? nil : params[:regional_partner_filter])
    end

    respond_to do |format|
      format.json do
        serialized_applications = applications.map {|a| Api::V1::Pd::ApplicationQuickViewSerializer.new(a).attributes}
        render json: serialized_applications
      end
      format.csv do
        course = role[0..2] # course is the first 3 characters in role, e.g. 'csf'
        csv_text = [TYPES_BY_ROLE[role].csv_header(course), *applications.map(&:to_csv_row)].join
        send_csv_attachment csv_text, "#{role}_applications.csv"
      end
    end
  end

  # GET /api/v1/pd/applications/cohort_view?role=:role&regional_partner_filter=:regional_partner_name
  def cohort_view
    applications = get_applications_by_role(params[:role].to_sym).where(status: ['accepted', 'withdrawn'])
    cohort_capacity = nil

    unless params[:regional_partner_filter].nil? || params[:regional_partner_filter] == 'all'
      applications = applications.where(regional_partner_id: params[:regional_partner_filter] == 'none' ? nil : params[:regional_partner_filter])
    end

    unless ['none', 'all'].include? params[:regional_partner_filter]
      partner_id = params[:regional_partner_filter] ? params[:regional_partner_filter] : current_user.regional_partners.first
      partner = RegionalPartner.find_by(id: partner_id)
      if params[:role] == 'csd_teachers'
        cohort_capacity = partner.cohort_capacity_csd
      elsif params[:role] == 'csp_teachers'
        cohort_capacity = partner.cohort_capacity_csp
      end
    end

    serializer =
      if TYPES_BY_ROLE[params[:role].to_sym] == Pd::Application::Facilitator1819Application
        Api::V1::Pd::FacilitatorApplicationCohortViewSerializer
      elsif TYPES_BY_ROLE[params[:role].to_sym] == Pd::Application::Teacher1819Application
        Api::V1::Pd::TeacherApplicationCohortViewSerializer
      end

    respond_to do |format|
      format.json do
        serialized_applications = applications.map {|a| serializer.new(a).attributes}
        render json: {
          applications: serialized_applications,
          capacity: cohort_capacity
        }
      end
      format.csv do
        csv_text = [TYPES_BY_ROLE[params[:role].to_sym].cohort_csv_header, applications.map(&:to_cohort_csv_row)].join
        send_csv_attachment csv_text, "#{params[:role]}_cohort_applications.csv"
      end
    end
  end

  # PATCH /api/v1/pd/applications/1
  def update
    application_data = application_params

    if application_data[:response_scores]
      JSON.parse(application_data[:response_scores]).transform_keys {|x| x.to_s.underscore}.to_json
    end

    if application_data[:regional_partner_filter] == REGIONAL_PARTNERS_NONE
      application_data[:regional_partner_filter] = nil
    end
    application_data["regional_partner_id"] = application_data.delete "regional_partner_filter"

    application_data["notes"] = application_data["notes"].strip_utf8mb4 if application_data["notes"]

    # only allow those with full management permission to lock/unlock and edit form data
    if current_user.workshop_admin?
      if current_user.workshop_admin? && application_admin_params.key?(:locked)
        application_admin_params[:locked] ? @application.lock! : @application.unlock!
      end

      @application.form_data_hash = application_admin_params[:form_data] if application_admin_params.key?(:form_data)
    end

    unless @application.update(application_data)
      return render status: :bad_request, json: {errors: @application.errors.full_messages}
    end

    render json: @application, serializer: Api::V1::Pd::ApplicationSerializer
  end

  # GET /api/v1/pd/applications/search
  def search
    email = params[:email]
    user = User.find_by_email email
    filtered_applications = @applications.where(
      application_year: YEAR_18_19,
      application_type: [TEACHER_APPLICATION, FACILITATOR_APPLICATION],
      user: user
    )

    serialized_applications = filtered_applications.map {|a| Api::V1::Pd::ApplicationSearchSerializer.new(a).attributes}
    render json: serialized_applications
  end

  private

  def get_applications_by_role(role)
    applications_of_type = @applications.where(type: TYPES_BY_ROLE[role].try(&:name))
    case role
    when :csf_facilitators
      return applications_of_type.csf
    when :csd_facilitators
      return applications_of_type.csd
    when :csp_facilitators
      return applications_of_type.csp
    when :csd_teachers
      return applications_of_type.csd
    when :csp_teachers
      return applications_of_type.csp
    else
      raise ActiveRecord::RecordNotFound
    end
  end

  def application_params
    params.require(:application).permit(
      :status,
      :notes,
      :regional_partner_filter,
      :response_scores,
      :pd_workshop_id,
      :fit_workshop_id
    )
  end

  def application_admin_params
    params.require(:application).tap do |application_params|
      application_params.permit(:locked)

      # Permit form_data: and everything under it
      application_params.permit(:form_data).permit!
    end
  end

  TYPES_BY_ROLE = {
    csf_facilitators: Pd::Application::Facilitator1819Application,
    csd_facilitators: Pd::Application::Facilitator1819Application,
    csp_facilitators: Pd::Application::Facilitator1819Application,
    csd_teachers: Pd::Application::Teacher1819Application,
    csp_teachers: Pd::Application::Teacher1819Application
  }
  ROLES = TYPES_BY_ROLE.keys

  def empty_application_data
    {}.tap do |app_data|
      TYPES_BY_ROLE.each do |role, app_type|
        app_data[role] = {}
        app_type.statuses.keys.each do |status|
          app_data[role][status] = {
            locked: 0,
            unlocked: 0
          }
        end
      end
    end
  end
end
