require 'json'
require 'acapela'
require 'net/http'
require 'uri'
require 'redcarpet'
require 'redcarpet/render_strip'

TTS_BUCKET = 'cdo-tts'

VOICES = {
  'en-us': {
    VOICE: 'sharon22k',
    SPEED: 180,
    SHAPE: 100
  },
  'es-es': {
    VOICE: 'ines22k',
    SPEED: 180,
    SHAPE: 100,
  },
  'es-mx': {
    VOICE: 'rosa22k',
    SPEED: 180,
    SHAPE: 100,
  },
  'it-it': {
    VOICE: 'vittorio22k',
    SPEED: 180,
    SHAPE: 100,
  },
  'pt-br': {
    VOICE: 'marcia22k',
    SPEED: 180,
    SHAPE: 100,
  }
}

class TTSSafe < Redcarpet::Render::StripDown
  def block_code(code, language)
    ''
  end

  def block_html(raw_html)
    ''
  end

  def raw_html(raw_html)
    ''
  end

  def link(link, title, content)
    ''
  end

  def image(link, title, alt_text)
    ''
  end
end

TTSSafeRenderer = Redcarpet::Markdown.new(TTSSafe)

module TextToSpeech
  extend ActiveSupport::Concern

  # TODO: this concern actually depends on the SerializedProperties
  # concern ... I'm not sure how best to deal with that.

  included do
    before_save :tts_update

    serialized_attrs %w(
      tts_instructions_override
      tts_markdown_instructions_override
    )
  end

  def self.locale_supported?(locale)
    VOICES.key?(locale)
  end

  def self.localized_voice
    # Use localized voice if we have a setting for the current locale;
    # default to English otherwise.
    loc = TextToSpeech.locale_supported?(I18n.locale) ? I18n.locale : :'en-us'
    VOICES[loc]
  end

  def self.tts_upload_to_s3(text, filename)
    return if text.blank?
    return if CDO.acapela_login.blank? || CDO.acapela_storage_app.blank? || CDO.acapela_storage_password.blank?
    return if AWS::S3.exists_in_bucket(TTS_BUCKET, filename)

    loc_voice = TextToSpeech.localized_voice
    url = acapela_text_to_audio_url(text, loc_voice[:VOICE], loc_voice[:SPEED], loc_voice[:SHAPE])
    return if url.nil?
    uri = URI.parse(url)
    Net::HTTP.start(uri.host) do |http|
      resp = http.get(uri.path)
      AWS::S3.upload_to_bucket(TTS_BUCKET, filename, resp.body, no_random: true)
    end
  end

  def tts_upload_to_s3(text)
    filename = tts_path(text)
    TextToSpeech.tts_upload_to_s3(text, filename)
  end

  def tts_url(text)
    "https://tts.code.org/#{tts_path(text)}"
  end

  def tts_path(text)
    content_hash = Digest::MD5.hexdigest(text)
    loc_voice = TextToSpeech.localized_voice
    "#{loc_voice[:VOICE]}/#{loc_voice[:SPEED]}/#{loc_voice[:SHAPE]}/#{content_hash}/#{name}.mp3"
  end

  def tts_should_update(property)
    changed = property_changed?(property)
    changed && write_to_file? && published
  end

  def tts_instructions_text
    if I18n.locale == I18n.default_locale
      # We still have to try localized instructions here for the
      # levels.js-defined levels
      tts_instructions_override || instructions || try(:localized_instructions) || ""
    else
      TTSSafeRenderer.render(try(:localized_instructions) || "")
    end
  end

  def tts_should_update_instructions?
    relevant_property = tts_instructions_override ? 'tts_instructions_override' : 'instructions'
    return tts_should_update(relevant_property)
  end

  def tts_markdown_instructions_text
    tts_markdown_instructions_override || TTSSafeRenderer.render(markdown_instructions || "")
  end

  def tts_should_update_markdown_instructions?
    relevant_property = tts_markdown_instructions_override ? 'tts_markdown_instructions_override' : 'markdown_instructions'
    return tts_should_update(relevant_property)
  end

  def tts_authored_hints_texts
    JSON.parse(authored_hints || '[]').map do |hint|
      TTSSafeRenderer.render(hint["hint_markdown"])
    end
  end

  def tts_update
    tts_upload_to_s3(tts_instructions_text) if tts_should_update_instructions?

    tts_upload_to_s3(tts_markdown_instructions_text) if tts_should_update_markdown_instructions?

    if authored_hints && tts_should_update('authored_hints')
      hints = JSON.parse(authored_hints)
      hints.each do |hint|
        text = TTSSafeRenderer.render(hint["hint_markdown"])
        tts_upload_to_s3(text)
        hint["tts_url"] = tts_url(text)
      end
      self.authored_hints = JSON.dump(hints)
    end
  end
end
