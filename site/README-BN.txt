Arju Online Management System - Corrected Dynamic Build

এই সংস্করণে:
1) সব Main Menu ও Submenu page-এ একই স্থায়ী Top Header আছে।
2) Sidebar-এর ওপর Header ঢোকে না; Header শুধু ডান পাশের content area-তে থাকে।
3) প্রতিটি Management page-এ নীল Page Header আছে; Page Header-এর ওপরে duplicate title রাখা হয়নি।
4) যেখানে প্রযোজ্য, Page Header-এর ডান পাশে বর্তমান record count দেখায়।
5) বিদ্যালয়ের তথ্য, Slider, Branch, Class, Subject, Student, Routine, Institutional Documents, Committee, Teacher/Staff, Notice, Holiday Notice, History, Merit Student, Gallery, Facebook এবং YouTube-এর management routes রাখা হয়েছে।
6) Routine-এ Add/Edit/Delete/Show-Hide আছে।
7) Slider edit modal compact, close (×), বাতিল এবং আপডেট আছে।
8) Dashboard-এ Website ব্যবস্থাপনা banner এবং live record count cards আছে।
9) সব PHP ফাইল syntax-checked.

INSTALL:
- XAMPP চালু করুন (Apache + MySQL)।
- database.sql phpMyAdmin-এ import করুন।
- config.php-এ database name/user/password প্রয়োজন অনুযায়ী দিন।
- school folder-এর মধ্যে রেখে /school/admin/setup.php খুলে Admin account তৈরি করুন।
- তারপর /school/admin/login.php থেকে login করুন।

নোট: এই build-এর runtime database operation MySQL/PDO-এর ওপর নির্ভর করে; এখানে PHP syntax ও code structure পরীক্ষা করা হয়েছে, কারণ এই পরিবেশে MySQL server চালু নেই।
