# == Schema Information
#
# Table name: sections
#
#  id                   :integer          not null, primary key
#  user_id              :integer          not null
#  name                 :string(255)
#  created_at           :datetime
#  updated_at           :datetime
#  code                 :string(255)
#  script_id            :integer
#  course_id            :integer
#  grade                :string(255)
#  login_type           :string(255)      default("email"), not null
#  deleted_at           :datetime
#  stage_extras         :boolean          default(FALSE), not null
#  section_type         :string(255)
#  first_activity_at    :datetime
#  pairing_allowed      :boolean          default(TRUE), not null
#  sharing_disabled     :boolean          default(FALSE), not null
#  hidden               :boolean          default(FALSE), not null
#  tts_autoplay_enabled :boolean          default(FALSE), not null
#  restrict_section     :boolean          default(FALSE)
#  properties           :text(65535)
#  participant_type     :string(255)      default("student"), not null
#  lti_integration_id   :bigint
#
# Indexes
#
#  fk_rails_20b1e5de46        (course_id)
#  fk_rails_f0d4df9901        (lti_integration_id)
#  index_sections_on_code     (code) UNIQUE
#  index_sections_on_user_id  (user_id)
#

class GoogleClassroomSection < OmniAuthSection
  def self.from_service(course_id, owner_id, student_list, section_name)
    code = "G-#{course_id}"

    set_family_name = DCDO.get('google_classroom_family_name', false)

    students = student_list.map do |student|
      OmniAuth::AuthHash.new(
        uid: student.user_id,
        provider: 'google_oauth2',
        info: {
          name: set_family_name ? student.profile.name.given_name : student.profile.name.full_name,
          family_name: set_family_name ? student.profile.name.family_name : nil,
        },
      )
    end

    from_omniauth(
      code: code,
      type: Section::LOGIN_TYPE_GOOGLE_CLASSROOM,
      owner_id: owner_id,
      students: students,
      section_name: section_name,
    )
  end
end
