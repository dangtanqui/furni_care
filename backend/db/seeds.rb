# Users
cs = User.create!(email: 'cs@demo.com', password: 'password', name: 'CS Demo', role: 'cs')
tech = User.create!(email: 'tech@demo.com', password: 'password', name: 'Tech Demo', role: 'technician')
leader = User.create!(email: 'leader@demo.com', password: 'password', name: 'Leader Demo', role: 'leader')

# Clients
client1 = Client.create!(name: 'ABC Furniture', code: 'ABC', address: '123 Main St', phone: '0901234567')
client2 = Client.create!(name: 'XYZ Interior', code: 'XYZ', address: '456 Oak Ave', phone: '0912345678')

# Sites
site1 = Site.create!(client: client1, name: 'HCM Office', address: '789 District 1', city: 'HCM')
site2 = Site.create!(client: client1, name: 'HN Branch', address: '321 Hoan Kiem', city: 'HN')
site3 = Site.create!(client: client2, name: 'Da Nang Store', address: '555 Beach Rd', city: 'DN')

# Contacts
Contact.create!(site: site1, name: 'Nguyen Van A', phone: '0901111111', email: 'a@abc.com', position: 'Manager')
Contact.create!(site: site1, name: 'Tran Thi B', phone: '0902222222', email: 'b@abc.com', position: 'Staff')
Contact.create!(site: site2, name: 'Le Van C', phone: '0903333333', email: 'c@abc.com', position: 'Manager')
Contact.create!(site: site3, name: 'Pham Thi D', phone: '0904444444', email: 'd@xyz.com', position: 'Director')

puts "Seed data created successfully!"
