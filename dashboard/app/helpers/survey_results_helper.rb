module SurveyResultsHelper
  DIVERSITY_SURVEY_ENABLED = false
  DEFAULT_NPS_AUDIENCE = "none"
  NPS_AUDIENCE = DCDO.get('nps_audience', DEFAULT_NPS_AUDIENCE)

  def show_diversity_survey?(kind)
    return false unless SurveyResultsHelper::DIVERSITY_SURVEY_ENABLED
    return false unless current_user
    return false unless language == "en"
    return false if current_user.under_13?
    return false if existing_survey_result?(kind)
    return false unless account_existed_14_days?
    return false unless current_user.teacher?
    return false unless has_any_students?
    return false unless has_any_student_under_13?
    return false unless country_us?

    # There is no reason not to show the survey, so show the survey.
    return true
  end

  def show_nps_survey?
    return false unless NPS_AUDIENCE != "none"
    return false unless current_user
    return false unless target_audience?(current_user.id)
    return false unless language == "en"
    return false if current_user.under_13?
    return false unless country_us?
    return false unless account_existed_14_days?

    # There is no reason not to show the survey, so show the survey.
    return true
  end

  def target_audience?(user_id)
    return (
      NPS_AUDIENCE == "all" ||
      (NPS_AUDIENCE == "odd" && user_id.odd) ||
      (NPS_AUDIENCE == "even" && user_id.even)
      )
  end

  def account_existed_14_days?
    DateTime.now - current_user.created_at.to_datetime >= 14
  end

  def existing_survey_result?(kind)
    SurveyResult.where(user_id: current_user.id, kind: kind).exists?
  end

  def country_us?
    request.location.try(:country_code) == 'US' ||
      (!Rails.env.production? && request.location.try(:country_code) == 'RD')
  end

  def has_any_students?
    !current_user.students.empty?
  end

  def has_any_student_under_13?
    current_user.students.any?(&:under_13?)
  end
end
