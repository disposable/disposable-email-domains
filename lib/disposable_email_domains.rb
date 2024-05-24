# frozen_string_literal: true

require_relative "disposable_email_domains/version"
require "set"

module DisposableEmailDomains
  class Error < StandardError; end

  class << self
    delegate :to_a, to: :set

    def include?(mail)
      return false if mail.nil?

      domain = mail[/@(.+)/, 1]
      disposable?(domain)
    end

    def disposable?(domain)
      set.include?(domain)
    end

    def set
      @@set ||= Set.new(from_datafile)
    end

    private

    def from_datafile
      path = File.join(File.dirname(File.expand_path(__FILE__)), "./../domains.txt")
      File.read(path).split("\n")
    end
  end
end
