# Configure path for assets
config[:css_dir] = 'assets/stylesheets'
config[:js_dir] = 'assets/javascripts'
config[:images_dir] = 'assets/images'
config[:images_extensions] = %w( svg jpg jpeg gif png webp )
config[:partials_dir] = 'partials'

# Configure path for bower assets
after_configuration do
  @bower_config = JSON.parse(IO.read("#{root}/.bowerrc"))
  assets_dir = @bower_config["directory"] # "vendor/assets/bower_components"
  sprockets.append_path File.join "#{root}", assets_dir

  masks = images_extensions.map { |ext| "#{assets_dir}/**/*.#{ext}" }

  # Import all the images from bower assets directory to build/assets/images
  Dir[*masks].each do |file_path|
    relative_path = file_path[("#{assets_dir}/".length)..-1] # e.g.: "open-iconic/png/resize-width.png"
    sprockets.import_asset(relative_path) { "assets/images/#{relative_path}" }
  end
end

# Blog
activate :blog do |blog|
  blog.default_extension = '.md'
  blog.new_article_template = 'article.erb'
  blog.paginate = true
  blog.permalink = "blog/{year}/{month}/{title}/index.html"
  blog.sources = "posts/{year}-{month}-{day}-{title}.html"
end

# Custom page layouts
page 'posts/*', layout: :article
page "/feed.xml", :layout => false

activate :autoprefixer
activate :directory_indexes
activate :syntax

set :markdown, fenced_code_blocks: true, with_toc_data: true
set :markdown_engine, :redcarpet

# Minimize css/js and fix assets for Build
configure :build do
  activate :gzip
  activate :minify_css
  activate :minify_javascript
  activate :minify_html
  activate :asset_hash
  activate :sitemap, :hostname => "https://labs.kollegorna.se"
end
