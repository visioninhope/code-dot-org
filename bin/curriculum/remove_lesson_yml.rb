#!/usr/bin/env ruby

# removes all remaining lesson fields from scripts.en.yml.

require_relative '../../dashboard/config/environment'

raise unless [:development, :levelbuilder].include? rack_env

units_yml = File.expand_path("#{Rails.root}/config/locales/scripts.en.yml")
i18n = File.exist?(units_yml) ? YAML.load_file(units_yml) : {}
scripts_by_name = i18n['en']['data']['script']['name']
scripts_by_name.keys.each do |script_name|
  scripts_by_name[script_name].delete('lessons')
end
File.write(units_yml, "# Autogenerated scripts locale file.\n" + i18n.to_yaml(line_width: -1))
