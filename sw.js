const cacheName = 'writarion-v3'; // ভার্সন আপডেট করা হয়েছে
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './background.js',
  './sabbir.png',
  './favicon-32x32.png',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png'
];

// ১. ইন্সটলেশন এবং ফাইল ক্যাশ করা
self.addEventListener('install', (e) => {
  self.skipWaiting(); // নতুন সার্ভিস ওয়ার্কার সাথে সাথে একটিভ হবে
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      console.log('Caching all assets...');
      // একে একে অ্যাড করা যাতে কোনো একটা ফাইল মিস হলে অন্যগুলো ক্যাশ হয়
      return Promise.all(
        assets.map(asset => {
          return cache.add(asset).catch(err => console.error(`Failed to cache: ${asset}`, err));
        })
      );
    })
  );
});

// ২. অ্যাক্টিভেশন এবং পুরনো ক্যাশ ডিলিট করা
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))
      );
    })
  );
});

// ৩. ফেচ রিকোয়েস্ট হ্যান্ডেল করা (অফলাইন সাপোর্ট)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => {
        // যদি নেটওয়ার্ক না থাকে এবং রিকোয়েস্টটি যদি পেজ হয়, তবে index.html দেখাবে
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
