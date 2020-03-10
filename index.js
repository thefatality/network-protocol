const DNSApplication = require('./application/DNSApplication')

const dns = new DNSApplication('172.20.10.1')
dns.queryDomain()
