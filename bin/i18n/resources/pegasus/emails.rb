require_relative '../../i18n_script_utils'

Dir[File.expand_path('../emails/**/*.rb', __FILE__)].sort.each {|file| require file}

module I18n
  module Resources
    module Pegasus
      module Emails
        DIR_NAME = 'emails'.freeze
        ORIGIN_DIR_PATH = CDO.dir("pegasus/#{DIR_NAME}").freeze
        I18N_SOURCE_DIR_PATH = CDO.dir(I18N_SOURCE_DIR, DIR_NAME).freeze

        def self.sync_in
          SyncIn.perform
        end

        def self.sync_out
          SyncOut.perform
        end
      end
    end
  end
end
