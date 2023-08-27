+++
title = "Getting Started"
date = 2018-06-09T20:48:00Z
[taxonomies]
categories = ["Technical"]
tags = ["blog"]
+++
So of course, the first blog post(s) will be a description of how I got this blog set up (well, this blog + another machine with Concourse on it).

So, here we go!

## Powered by?
Powered by [Ghost](https://ghost.org/).

### Why Ghost?
I was looking for something relatively simple, and I'm not a huge fan of Wordpress, for all that it's a well-known, well-tested platform. I also don't need all the features that Wordpress provides - Ghost is much closer to what I actually _need_ out of a blogging platform.

## Hosting
This blog is hosted on [Digital Ocean](https://wwww.digitalocean.com). They have an API, and [Terraform](https://www.terraform.io/) has helpfully built out a [provider](https://www.terraform.io/docs/providers/do/) on top of that API.

Did I have to use Terraform for this? No, of course not. I could have handily configured all of this manually, but I would _prefer_ to have my entire setup stored in Git, so that it's easy to re-create from scratch, e.g., if my droplet is compromised somehow.

### Before you start
You will need to
* Create a Digital Ocean Account.
* Create a [Digital Ocean API key](https://cloud.digitalocean.com/settings/api/tokens).
* Create a [Digital Ocean SSH key pair](https://cloud.digitalocean.com/settings/security) (under SSH Keys) and save the private key somewhere secure.
* [Install Terraform](https://www.terraform.io/intro/getting-started/install.html) on your local machine. Note that Terraform do _not_ have an Ubuntu PPA or the like, so you'll need to install manually if you're on Linux.
* Install [Jq](https://stedolan.github.io/jq/).
* A domain that you have control enough (enough control to add `A`, `CNAME`, and `TXT` records, at least)

### Terraform

My Terraform config looks like the following:
```
resource "digitalocean_droplet" "ghost" {
  image    = "ghost-16-04"
  name     = "ghost"
  region   = "lon1"
  size     = "s-1vcpu-1gb"
  ssh_keys = [1234]
}

resource "digitalocean_firewall" "allow-outbound" {
  name = "allow-outbound"

  droplet_ids = ["${digitalocean_droplet.ghost.id}"]

  outbound_rule = [
    {
      protocol                = "icmp"
      port_range              = "1-65535"
      destination_addresses   = ["0.0.0.0/0", "::/0"]
    },
    {
      protocol                = "tcp"
      port_range              = "1-65535"
      destination_addresses   = ["0.0.0.0/0", "::/0"]
    },
    {
      protocol                = "udp"
      port_range              = "1-65535"
      destination_addresses   = ["0.0.0.0/0", "::/0"]
    },
  ]
}

resource "digitalocean_firewall" "allow-ssh" {
  name = "allow-ssh"

  inbound_rule = [
    {
      protocol           = "tcp"
      port_range         = "22"
      source_addresses   = "${var.ssh_ips}"
    },
  ]

  droplet_ids = ["${digitalocean_droplet.ghost.id}"]
}

resource "digitalocean_firewall" "allow-web-all" {
  name = "allow-web-all"

  droplet_ids = ["${digitalocean_droplet.ghost.id}"]

  inbound_rule = [
    {
      protocol           = "tcp"
      port_range         = "80"
      source_addresses   = ["0.0.0.0/0", "::/0"]
    },
    {
      protocol           = "tcp"
      port_range         = "443"
      source_addresses   = ["0.0.0.0/0", "::/0"]
    },
  ]
}
```

Most of this should be relatively straightfoward, assuming you have a basic understanding of Terraform (it is beyond the scope of this post to provide a Terraform tutorial):

* Create a new Droplet resource called `ghost`,
* Create a firewall rule allowing for inbound SSH traffice from a whitelisted set of IP address
* Create a firewall rule allowing for incoming web traffic on ports 80 and 443
* Create a firewall rule allowing all outgoing TCP/UDP/ICMP traffic.

However, there are a few points that I need to explain in more detail, particularly how you find the various Digital Ocean slugs, as you do _not_ appear to be able to get them from the Web UI.

#### SSH Keys
How do you find the value you should put in `ssh_keys = [1234]`? You'll need your Digital Ocean API Key, and then we can manually curl the API to get a list of valid IDs:

```
curl -s \
    -X GET \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <do_api_key> \
    "https://api.digitalocean.com/v2/account/keys" \
    | jq \
    -r \
    '.ssh_keys | map("\(.name)=\(.id)") | .[]'
```

This will give you something like the following:

```
Home SSH Key=1234
```

This is the name of the SSH key, and the ID that you will need to use in your Terraform file.

#### Regions
To get a list of the region slugs you will need for ` `, then you will need to run the following command:

```
curl -s \
    -X GET \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <do_api_key>" \
    "https://api.digitalocean.com/v2/regions?per_page=999" \
    | jq \
    -r \
    '([{"name": "Name", "slug": "Slug"}] + (.regions | sort_by(.name))) | map("\(.name)|\(.slug)") | .[]' \
    | column -t -s \|
```

This will give you output like

```
Name             Slug
Amsterdam 3      ams3
Bangalore 1      blr1
Frankfurt 1      fra1
London 1         lon1
New York 1       nyc1
New York 3       nyc3
San Francisco 2  sfo2
Singapore 1      sgp1
Toronto 1        tor1
```

Take the appropriate slug, and add it to your Terraform file.

#### Droplet Size
To get the slug of the droplet size you will need for `size = "s-1vcpu-1gb"`, then you will need to run the following command:

```
curl -s \
    -X GET \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <do_api_key>" \
    "https://api.digitalocean.com/v2/sizes?per_page=999"  \
    | jq \
    -r \
    '(.sizes + [{"price_monthly": "Price", "memory": "Memory", "vcpus": "VCPU", "disk": "Disk", "slug": "Slug", "regions": []}]) | map("\(.price_monthly)$|\(.memory)|\(.vcpus)|\(.disk)|\(.slug)|in regions [\(.regions | join(", "))]") | .[]' \
    | sort -n \
    | column -t -s \|
```

This will produce output like the following:

```
Price$  Memory  VCPU  Disk  Slug            in regions []
5$      1024    1     25    s-1vcpu-1gb     in regions [ams2, ams3, blr1, fra1, lon1, nyc1, nyc2, nyc3, sfo1, sfo2, sgp1, tor1]
5$      512     1     20    512mb           in regions [ams2, ams3, blr1, fra1, lon1, nyc1, nyc2, nyc3, sfo1, sfo2, sgp1, tor1]
10$     1024    1     30    1gb             in regions [ams2, ams3, blr1, fra1, lon1, nyc1, nyc2, nyc3, sfo1, sfo2, sgp1, tor1]
10$     2048    1     50    s-1vcpu-2gb     in regions [ams2, ams3, blr1, fra1, lon1, nyc1, nyc2, nyc3, sfo1, sfo2, sgp1, tor1]
.
.
.
```

Find the slug for the desired droplet size (e.g. `s-1vcpu-2gb`), and insert that into your Terraform script.


#### Image Slug
The image slug that I'm using in `image = "ghost-16-04"` doesn't match up terribly well with the description you can find in the Digital Ocean dashboard. You will need to use the API to match up the image name with the image slug, like so:

```
curl -s \
    -X GET \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <do_api_key>" \
    "https://api.digitalocean.com/v2/images?per_page=999" \
    | jq \
    -r \
    '[.images[] | select(.slug != null)] | map("\(.distribution) \(.name)|\(.slug)|in regions [\(.regions | join(", "))]") | .[]' \
    | sort \
    | column -t -s \|
```

This will produce a list of available slugs, like so:

```
CentOS 6.9 x32                          centos-6-x32          in regions [nyc1, sfo1, nyc2, ams2, sgp1, lon1, nyc3, ams3, fra1, tor1, sfo2, blr1]
CentOS 6.9 x64                          centos-6-x64          in regions [nyc1, sfo1, nyc2, ams2, sgp1, lon1, nyc3, ams3, fra1, tor1, sfo2, blr1]
.
.
.
```

Note that not all images are availalable in all regions (e.g. `coreos-alpha` is _not_ available in `sfo2` or `blr1`).

#### Terraform Variables

I also have a `vars.tf` file which looks like this:

```
variable "ssh_ips" {
  type    = "list"
  default = [
    "1.2.3.4/32", # insert actual IP here
  ]
}
```

You should replace `1.2.3.4/32` with your own IP address, or with `0.0.0.0/0` if you want to allow SSH logins from anywhere.

### Executing

Once the Terraform configuration is up and running, just run `terraform plan` to see what's going to happen:

```
$ terraform plan
provider.digitalocean.token
  The token key for API operations.

  Enter a value: <insert_do_api_key>
.
.
.
```

If everything looks good, run `terraform apply` to actually make the changes. Wait a little while - maybe 10 minutes - and everything should be done.

## DNS
Once you have created your virtual machines, you will need to add DNS records for them.

You can get the IPV4 address out of Terraform like so:

```
terraform state show digitalocean_droplet.ghost \
    | grep 'ipv4_address'
```

Make sure to add that to your DNS provider (in my case, that's [Namecheap](https://www.namecheap.com/)). This could potentially be done through Terraform as well, but I had to wait for my Namecheap API to become active, and I was too impatient for that, so I did it manually.

# Next

In the next step, I will describe how I configured the server with [Ansible](https://www.ansible.com/). For the Ghost server, this is limited to configuring [Let's Encrypt](https://letsencrypt.org/), but I will delve into how I built a very basic [Concourse CI](https://concourse-ci.org/) server later on.
