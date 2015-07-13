module Gravatar

  def gravatar_for(email, size=400)
    hash = Digest::MD5.hexdigest(email.chomp.downcase)
    "http://www.gravatar.com/avatar/#{hash}?s=#{size}"
  end

end
