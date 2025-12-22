# Serializer for Site model
class SiteSerializer
  def initialize(site, options = {})
    @site = site
    @options = options
  end

  def as_json(options = {})
    {
      id: @site.id,
      name: @site.name,
      city: @site.city
    }
  end

  def self.collection(sites, options = {})
    sites.map { |site| new(site, options).as_json }
  end
end
