# frozen_string_literal: true

require_relative "disposable_email_domains/version"

module DisposableEmailDomains
  class Error < StandardError; end
  # Your code goes here...

  class << self
    def include?(mail)
      return false if mail.nil?

      domain = mail[/@(.+)/, 1]
      list.bsearch { |d| domain <=> d }
    end

    def list
      @@list ||= from_datafile
    end

    private

    def from_datafile
      path = File.join(File.dirname(File.expand_path(__FILE__)), "./../domains.txt")
      File.read(path).split("\n")
    end
  end
end
