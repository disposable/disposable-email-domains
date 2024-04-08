# frozen_string_literal: true

require_relative "lib/disposable_email_domains/version"

Gem::Specification.new do |spec|
  spec.name = "disposable_email_domains"
  spec.version = DisposableEmailDomains::VERSION
  spec.authors = ["Andriy Tyurnikov"]
  spec.email = ["Andriy.Tyurnikov@gmail.com"]

  spec.summary = "List of disposable email domains"
  spec.description = "List of disposable email domains"
  spec.homepage = "https://github.com/minichat-com/disposable-email-domains"
  spec.required_ruby_version = ">= 3.0.0"

  # spec.metadata["allowed_push_host"] = "TODO: Set to your gem server 'https://example.com'"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/minichat-com/disposable-email-domains"
  spec.metadata["changelog_uri"] = "https://github.com/minichat-com/disposable-email-domains"

  # Specify which files should be added to the gem when it is released.
  # The `git ls-files -z` loads the files in the RubyGem that have been added into git.
  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    `git ls-files -z`.split("\x0").reject do |f|
      (f == __FILE__) ||
        f.match(%r{^(test|spec|features)/}) ||
        f.match(%r{\A(?:(?:test|spec|features)/|\.(?:git|travis|circleci)|appveyor)})
    end
  end

  spec.bindir = "exe"
  spec.executables = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  # Uncomment to register a new dependency of your gem
  # spec.add_dependency "example-gem", "~> 1.0"

  # For more information and examples about making a new gem, checkout our
  # guide at: https://bundler.io/guides/creating_gem.html
end
