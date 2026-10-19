# বিক্রির জন্য Multi-School System

এই build-এ প্রতিটি স্কুলের ডেটা আলাদা tenant slug দিয়ে সংরক্ষিত হয়। ফলে একটি স্কুলের নোটিশ, শিক্ষক, শিক্ষার্থী, গ্যালারি বা রুটিন অন্য স্কুলে দেখা যাবে না।

## Roles

- **Super Admin:** সব স্কুল তৈরি, সক্রিয়/সাসপেন্ড, প্ল্যান ও tenant পরিচালনা করবে।
- **School Admin:** শুধু নিজের স্কুলের ওয়েবসাইট ও ডেটা পরিচালনা করবে।
- **Student:** নিজের স্কুলের Student ID দিয়ে পোর্টালে প্রবেশ করবে।
- **Public Visitor:** নির্দিষ্ট স্কুলের ওয়েবসাইট দেখবে।

## Environment variables

- `SUPER_ADMIN_PASSWORD` — প্ল্যাটফর্ম মালিকের password
- `ADMIN_PASSWORD` — নির্দিষ্ট স্কুলের admin password
- `DEFAULT_SCHOOL_SLUG` — default স্কুল, যেমন `ballovpur`

## Tenant নির্বাচন

- URL: `?school=school-slug`
- Header: `x-school-slug: school-slug`
- Custom domain ব্যবহার করলে প্রতিটি deployment-এ `DEFAULT_SCHOOL_SLUG` সেট করা যাবে।

## Super Admin API

`/.netlify/functions/super-admin-api`

Header: `x-super-admin-password: <SUPER_ADMIN_PASSWORD>`

- `GET` — সব স্কুলের তালিকা
- `POST {"action":"upsertTenant","tenant":{"slug":"demo-school","nameBn":"ডেমো স্কুল"}}`
- `POST {"action":"setStatus","slug":"demo-school","status":"suspended"}`
- `POST {"action":"deleteTenant","slug":"demo-school"}`

## বিক্রির সময় প্রতিটি স্কুলের জন্য

1. স্কুলের নাম, ঠিকানা, লোগো ও domain/slug তৈরি করুন।
2. School Admin password দিন।
3. স্কুলকে active করুন।
4. School Admin-কে শুধু তার school URL দিন।
5. চুক্তি শেষ হলে tenant status `suspended` করুন।

## গুরুত্বপূর্ণ

এটি multi-tenant data isolation-এর production foundation। Payment gateway, automated billing, custom-domain provisioning এবং পূর্ণ visual Super Admin dashboard পরবর্তী ধাপে যুক্ত করা যাবে।

## Visual Super Admin

Open `/super-admin.html`, enter `SUPER_ADMIN_PASSWORD`, then create schools and activate/suspend them from the dashboard. User passwords are hashed before storage when created from the Admin account page.


## School Admin password

Super Admin-এর স্কুল তৈরির form-এ Admin Password দিন। Password hash হয়ে tenant record-এ থাকে। স্কুল active হলে সেই school slug-এর Admin password দিয়ে `/admin/`-এ login করা যায়; suspended হলে login বন্ধ থাকে। `ADMIN_PASSWORD` এখন শুধু legacy fallback হিসেবে রাখা হয়েছে।
