# coding: utf-8

Gem::Specification.new do |spec|
  spec.name          = "chris2fourlaw_website"
  spec.version       = "1.0"
  spec.authors       = ["Chris Lawson"]
  spec.email         = ["admin@chris2fourlaw.me"]

  spec.summary       = %q{A portfolio website.}
  spec.homepage      = "https://gitlab.com/Chris2fourlaw/chris2fourlaw.github.io"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").select { |f| f.match(%r{^(assets|_layouts|_includes|_sass|LICENSE|README)}i) }

  spec.add_development_dependency "jekyll", "~> 3.3"
  spec.add_development_dependency "bundler", "~> 1.12"
end
