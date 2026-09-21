# cPanel সাইট সম্পূর্ণ স্বতন্ত্র ও স্থিতিশীল করা

## লক্ষ্য
- `https://eip.lat/bdwineiplat/`-এর হোম, সব ৯টি গেম, ৪টি ক্যাটাগরি, ট্রেডার ডিটেইল ও `/owner` পেজ নির্ভরযোগ্যভাবে চালানো।
- বর্তমান মূল/Lovable সাইট বা অন্য PassGate সার্ভার বন্ধ থাকলেও cPanel কপি চালু রাখা।

## যা বদলাবে
1. **পাসওয়ার্ড cPanel-এ স্থানান্তর**
   - cPanel PHP API-তে password verify, signed session ও session validation যোগ হবে।
   - ব্রাউজার শুধু cPanel-এর নিজস্ব `/api/` কল করবে; `passgate.eip.lat` নির্ভরতা বাদ যাবে।
   - দেওয়া পাসওয়ার্ড plaintext হিসেবে সংরক্ষণ না করে hash আকারে থাকবে।

2. **পেজ লোড আটকে যাওয়া বন্ধ**
   - হোম/গেম API request-এ ছোট timeout ও retry-safe fallback থাকবে।
   - পেজ request-এর ভেতর upstream lottery server call সরানো হবে; পেজ শুধু SQLite-এর সংরক্ষিত ডাটা পড়বে।
   - নতুন ডাটা শুধু cron/ingest URL দিয়ে capture হবে, ফলে upstream ধীর হলেও page hang করবে না।
   - auth check চলাকালে blank screen-এর বদলে স্থির loading screen থাকবে।

3. **সম্পূর্ণ cPanel-ভিত্তিক build**
   - API URL একই cPanel folder-এর relative URL হবে।
   - root ও subfolder—দুই অবস্থায় asset, router ও API path সঠিক থাকবে।
   - মূল সাইট/Node server/পুরোনো backend-এর runtime reference খুঁজে সরানো হবে।

4. **লাইভ পরীক্ষা ও আপলোড**
   - নতুন static build এবং PHP files cPanel-এ আপলোড হবে।
   - দেওয়া পাসওয়ার্ড দিয়ে হোম, ৯টি game dashboard, category switch, predictor detail এবং owner page পরীক্ষা হবে।
   - console error, failed request, দীর্ঘ loading, deep-link refresh এবং mobile/desktop viewport যাচাই হবে।

## নিরাপত্তা ও cron
- একবারের seed endpoint সরানো/বন্ধ করা হবে।
- cron ingest key শক্তিশালী করা হবে এবং নতুন third-party cron URL দেওয়া হবে।
- API ব্যর্থ হলেও পুরোনো সংরক্ষিত ডাটা দেখাবে; UI অনন্তকাল loading দেখাবে না।
