#!/usr/bin/env ruby

require_relative '../../../i18n_script_utils'
require_relative '../../../utils/sync_in_base'
require_relative '../../../utils/pegasus_markdown'
require_relative '../markdown'

module I18n
  module Resources
    module Pegasus
      module Markdown
        class SyncIn < I18n::Utils::SyncInBase
          LOCALIZABLE_FILE_SUBPATHS = %w[
            public/athome.md.partial
            public/csforgood.md
            public/curriculum/unplugged.md.partial
            public/educate/it.md
            public/helloworld.md.partial
          ].freeze

          def process
            progress_bar.total = LOCALIZABLE_FILE_SUBPATHS.size
            I18nScriptUtils.process_in_threads(LOCALIZABLE_FILE_SUBPATHS) do |file_subpath|
              origin_file_path = File.join(ORIGIN_DIR_PATH, file_subpath)
              next unless File.exist?(origin_file_path)

              # TODO: refactor this confusing dir structure
              i18n_source_file_path = File.join(I18N_SOURCE_DIR_PATH, file_subpath).delete_suffix(PARTIAL_EXTNAME)
              i18n_source_file_path = i18n_source_file_path.sub('public/public/', 'public/')

              I18nScriptUtils.copy_file(origin_file_path, i18n_source_file_path)
              I18n::Utils::PegasusMarkdown.sanitize_file_header(i18n_source_file_path)
            ensure
              mutex.synchronize {progress_bar.increment}
            end
          end
        end
      end
    end
  end
end

I18n::Resources::Pegasus::Markdown::SyncIn.perform if __FILE__ == $0
