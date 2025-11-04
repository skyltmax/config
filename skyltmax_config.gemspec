# frozen_string_literal: true

Gem::Specification.new do |s|
  s.name          = "skyltmax_config"
  s.version       = "0.0.3"
  s.platform      = Gem::Platform::RUBY
  s.required_ruby_version = ">= 3.4.0"
  s.summary       = "Skyltmax shared config"
  s.homepage      = "https://github.com/skyltmax/config"
  s.authors       = ["Skyltmax"]
  s.license       = "MIT"
  s.metadata      = {
    "homepage_uri"    => "https://github.com/skyltmax/config#readme",
    "source_code_uri" => "https://github.com/skyltmax/config",
    "bug_tracker_uri" => "https://github.com/skyltmax/config/issues",
  }

  # include all tracked files so packaged gem mirrors the repo's config assets
  s.files = Dir.chdir(__dir__) do
    `git ls-files -z`.split("\x0").reject { |path| path.start_with?(".github/") }
  end
  s.require_path = "lib"

  s.add_dependency "rubocop", ">= 1.81.0", "< 2"
  s.add_dependency "rubocop-performance", ">= 1.26.0", "< 2"
  s.add_dependency "rubocop-rails", ">= 2.33.0", "< 3"

  s.add_development_dependency "rake", "~> 13.0"
end
