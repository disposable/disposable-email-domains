# frozen_string_literal: true

require "test_helper"

class DisposableEmailDomainsTest < Minitest::Test
  def test_that_it_has_a_version_number
    refute_nil ::DisposableEmailDomains::VERSION
  end

  def test_set
    assert_kind_of Set, DisposableEmailDomains.set
    refute_empty DisposableEmailDomains.set

    DisposableEmailDomains.set.each do |domain|
      assert_kind_of String, domain
      refute_match(/[@\s]/, domain)
    end
  end

  def test_include
    DisposableEmailDomains.set.each do |domain|
      assert DisposableEmailDomains.include? "bot@#{domain}"
    end

    refute DisposableEmailDomains.include? "legit-person@yahoo.com"
    refute DisposableEmailDomains.include? "someone@gmail.com"
    refute DisposableEmailDomains.include? nil
  end
end
