# কোড অডিট ও সংশোধন নোট

এই প্যাকেজে ১ম–৪র্থ ভিডিওর দৃশ্যমান workflow-এর সঙ্গে সম্পর্কিত বর্তমান কোড, Netlify Functions, admin UI, student/teacher login ও multi-school tenant flow পর্যালোচনা করা হয়েছে।

## সংশোধন
- Super Admin-এর `upsertTenant`-এ existing school update করলে duplicate tenant তৈরি হওয়া এবং password hash অকারণে মুছে যাওয়ার bug ঠিক করা হয়েছে।
- নতুন school Admin password কমপক্ষে ৮ অক্ষরের করা হয়েছে; existing school edit করার সময় password ফাঁকা রাখলে আগের password অক্ষত থাকে।
- `SESSION_SECRET`-কে session signing-এর অগ্রাধিকার দেওয়া হয়েছে; legacy `ADMIN_PASSWORD` এবং `SUPER_ADMIN_PASSWORD` fallback রাখা হয়েছে।
- `auth?action=me`-এর `configured` মান সবসময় `true` দেখানোর bug ঠিক করা হয়েছে।
- `?school=<slug>` দিয়ে প্রবেশ করলে tenant cookie সংরক্ষণ হয়, যাতে পরের page navigation ও API request-এ একই school context থাকে। HTML entry pages-এও early bootstrap যোগ করা হয়েছে।
- DEFAULT_DATA-তে attendance, marks, exams, examSubjects, admitCards, fees ও applications collection যোগ করা হয়েছে।
- Netlify deploy নির্দেশনায় ভুল পুরোনো folder name সংশোধন করে বর্তমান `school-website-main` path এবং session secret উল্লেখ করা হয়েছে।

## যাচাই
- সব Netlify `.mjs` ও site JavaScript ফাইল `node --check` দিয়ে syntax-checked।
- ZIP-এর ফাইল তালিকা এবং Netlify folder structure যাচাই করা হয়েছে।

## গুরুত্বপূর্ণ সীমাবদ্ধতা
এই পরিবেশে Netlify account, deployed URL, Netlify Blobs এবং environment variables-এ প্রবেশ নেই। তাই live login, file upload, persistent data, tenant isolation ও browser end-to-end workflow বাস্তব deployment-এ পরীক্ষা করা সম্ভব হয়নি। ভিডিওতে দেখা সব exam/admit-card/teacher workflow সম্পূর্ণ live-backend connected বলে দাবি করা হচ্ছে না; deploy করার পর staging school দিয়ে end-to-end acceptance test করা আবশ্যক।
