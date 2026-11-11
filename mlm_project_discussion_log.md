# MLM / Investment Software System - Discussion & Logic Log

---

## Turn 1

**User:** 
Eta bujho kina bolo *(Attached Image 1: Handwritten Customer Panel & Wallet Wireframe)*

**Gemini:**
এই হাতে লেখা নোটটি মূলত একটি **MLM (Multi-Level Marketing) বা ইনভেস্টমেন্ট/ওয়ালেট ম্যানেজমেন্ট ওয়েব অ্যাপ্লিকেশনের Customer Panel-এর ফিচার রিকোয়ারমেন্ট বা ওয়্যারফ্রেম নোট**। 

নোটের প্রতিটি অংশ নিচে পরিষ্কারভাবে সাজিয়ে দেওয়া হলো:

### ১. Customer Dashboard ও Profile (উপরের ডান পাশ)
ড্যাশবোর্ডে ইউজারের মূল ওয়ালেট ব্যালেন্স এবং প্রোফাইল স্ট্যাটাস দেখা যাবে:
* **Main Balance Display:** **E-Wallet** (যেমন: 50K) এবং **G-Wallet** (মাঝখানের *T-Wallet* কেটে দেওয়া হয়েছে)।
* **User Info:** ইউজারের **Picture**, **Name**, এবং **User ID / ID** থাকবে।
* **Account Status:** আইডির স্ট্যাটাস **Normal** নাকি **Active** (যদি Active হয় তবে **Green** সিগন্যাল বা ব্যাজ দেখাবে)।

### ২. Account Controls & Genealogy (উপরের বাম পাশ)
কাস্টমার প্যানেলে কোন কোন অ্যাকশন কীভাবে কাজ করবে তার নিয়ম:
* **Forgot Password (Admin):** পাসওয়ার্ড রিসেট বা রিকভারি অ্যাডমিনের মাধ্যমে নিয়ন্ত্রিত হবে।
* **Rename (Admin):** ইউজারের নাম পরিবর্তন শুধুমাত্র অ্যাডমিন করতে পারবে।
* **Mobile Number Change (Admin):** মোবাইল নম্বর পরিবর্তনও অ্যাডমিন প্যানেল থেকে করতে হবে (ইউজার নিজে সরাসরি পরিবর্তন করতে পারবে না)।
* **Tree Open:** ইউজার তার রেফারেল বা জেনিয়ালজি ট্রি (Genealogy Tree) দেখতে পারবে।
* **Placement (X):** প্লেসমেন্ট অপশনটি কাটা (X) দেওয়া আছে, অর্থাৎ কাস্টমার প্যানেল থেকে প্লেসমেন্ট পরিবর্তন বা সিলেক্ট করা বন্ধ থাকবে (অথবা এই ফিচারটি বাদ দেওয়া হয়েছে)।

### ৩. Wallet Breakdown (মাঝখানের বাম পাশ)
সিস্টেমে মোট তিনটি সাব-ওয়ালেট ও তাদের কাজ উল্লেখ করা হয়েছে:
* **C-Wallet (15K):** সম্ভবত *Commission Wallet* (রেফারেল বা জেনারেশন কমিশন জমার ওয়ালেট)।
* **R-Wallet (20K) — (ROI -):** *Return on Investment Wallet*, যেখানে প্রতিদিনের বা নির্দিষ্ট সময়ের মুনাফা (ROI) জমা হবে।
* **T-Wallet (10K) — (ID-ID Transfer):** *Transfer Wallet*, যা দিয়ে এক ইউজার আইডি থেকে অন্য ইউজার আইডিতে ব্যালেন্স ট্রান্সফার করা যাবে।

### ৪. Deposit System (মাঝখানের ডান পাশ)
টাকা ডিপোজিট করার মাধ্যম এবং গন্তব্য:
* ডিপোজিট করা ব্যালেন্স মূলত **G-Wallet** (General/Global Wallet)-এ যুক্ত হবে।
* **Payment Methods:** 
  * **Bank** (ব্যাংক ট্রান্সফার)
  * **MFS** (Mobile Financial Services - যেমন bKash, Nagad, Rocket)
  * **Digital** (ক্রিপ্টো/USDT বা অন্যান্য ডিজিটাল পেমেন্ট গেটওয়ে)

### ৫. Withdraw System (নিচের অংশ)
টাকা উত্তোলনের (Withdraw) চ্যানেল এবং পেমেন্ট মেথড:
* **Withdraw Channels (কার মাধ্যমে তোলা যাবে):** 
  * সরাসরি **Admin**-এর কাছে রিকোয়েস্ট দিয়ে
  * **Agent**-এর মাধ্যমে
  * **ID-ID** (অন্য ইউজারের আইডিতে ট্রান্সফার করে)
* **Payout Methods (টাকা পাওয়ার মাধ্যম):** 
  * **Bank**
  * **MFS** (যেমন: bKash ইত্যাদি)
  * **Digital**

---

## Turn 2

**User:** 
*(Attached Image 2: Printed Business Plan)*

**Gemini:**
এই পেজটি আপনার আগের নোটটিরই **Core Business Logic (অ্যালগরিদম এবং ক্যালকুলেশন রুলস)**। সফটওয়্যারের ব্যাকএন্ড এবং ওয়ালেট সিস্টেম কীভাবে কাজ করবে, তা এই ৫টি পয়েন্টের মাধ্যমে পুরোপুরি পরিষ্কার হয়ে গেছে:

### ১. ROI ও ক্যাপিটাল রিটার্ন লজিক (Plot / Flat Booking Income Program)
* **বেস ক্যালকুলেশন:** প্রতি **1,00,000 Tk** ইনভেস্টমেন্টের বিপরীতে ইউজার মাসে **11,111 Tk** করে পাবে।
* **ভাঙানো হিসাব `(5,555 + 5,555)`:** এখানে মূল টাকা (Capital return = 5.555%) এবং লভ্যাংশ (Profit = 5.555%) মিলিয়ে প্রতি মাসে মোট **11.111%** করে দেওয়া হচ্ছে। 
* **মেয়াদ ও মোট রিটার্ন:** এটি **18 Months** চলবে এবং ১৮ মাস শেষে মোট রিটার্ন হবে **2,00,000 Tk** (অর্থাৎ আসল + সমপরিমাণ লাভ = মোট দ্বিগুণ বা 200%)।
* **ওয়ালেট কানেকশন:** আগের নোট অনুযায়ী এই মাসিক রিটার্নের টাকাটা সরাসরি ইউজারের **R-Wallet (ROI Wallet)**-এ জমা হবে।

### ২. ডিরেক্ট রেফারেল কমিশন (Marketing Commission Structure)
* কোনো ইউজার সরাসরি কাউকে রেফার করে ইনভেস্ট করালে সাথে সাথে ইনভেস্টমেন্ট অ্যামাউন্টের ওপর **6% Direct Referral Commission** পাবে। 
* এটি ইউজারের **C-Wallet (Commission Wallet)**-এ যুক্ত হবে।

### ৩. টিম কমিশন (Marketing Team Collection Program)
* ইউজারের নিচে থাকা পুরো টিমের (Genealogy Tree) মোট কালেকশন বা সেলসের ওপর **5% Team Sales Commission** থাকবে। 

### ৪. উইথড্রয়াল রুলস ও চার্জ (Daily Withdrawal Facility)
* **উইথড্র টাইম:** প্রতিদিন (Daily) উইথড্র করা যাবে।
* **লিমিট:** সর্বনিম্ন (Minimum) **1,000 Tk** এবং সর্বোচ্চ (Maximum) **Unlimited**।
* **ট্রানজেকশন ফি:** প্রতিটি উইথড্র বা ট্রানজেকশনে **10% চার্জ** কাটা হবে।

### ৫. ইনভেস্টমেন্ট প্যাকেজ/স্লট (Investment Slot Options)
ইউজাররা ইচ্ছেমতো যেকোনো অ্যামাউন্ট ইনভেস্ট করতে পারবে না, বরং নির্দিষ্ট কিছু **Premium Slots** বা প্যাকেজ থাকবে:

| Slot Value (Investment) | Monthly Return (18 Months) | Total Return (2x) |
| :--- | :--- | :--- |
| **10,000 Tk** | ~1,111 Tk | 20,000 Tk |
| **50,000 Tk** | ~5,555 Tk | 1,00,000 Tk |
| **1,00,000 Tk** | 11,111 Tk | 2,00,000 Tk |
| **2,00,000 Tk** | ~22,222 Tk | 4,00,000 Tk |
| **5,00,000 Tk** | ~55,555 Tk | 10,00,000 Tk |

---

## Turn 3

**User:** 
*(Attached Image 3: Career Growth: Rank & Rewards Program)*

**Gemini:**
এই পেজটি দিয়ে পুরো সিস্টেমের **Career Growth: Rank & Rewards Program** বা র‍্যাংক প্রমোশন ও ইনসেনটিভ লজিকটি কমপ্লিট হলো।

| Rank | Qualification Criteria | Leadership Requirement | Rewards & Benefits |
| :--- | :--- | :--- | :--- |
| **1. Sr. Executive Officer** | 10 Lac Tk | 10 Lac Tk | • 10,000 Tk Rewards |
| **2. Asst. Manager** | 2x Sr. Executive Officer | 2x Sr. Executive Officer | • Salary 5,000 Tk For 6 Months |
| **3. Manager** | 2x Asst. Manager | 2x Asst. Manager | • Salary 15,000 Tk For 6 Months, • Laptop / PC |
| **4. Asst. General Manager** | 2x Manager | 2x Manager | • Salary 50,000 Tk For 6 Months, • Family tour (Cox's Bazar) |
| **5. Deputy General Manager** | 2x Asst. General Manager | 2x Asst. General Manager | • Salary 1,00,000 Tk For 6 Months, • Car |
| **6. General Manager** | 2x Deputy General Manager | 2x Deputy General Manager | • Salary 3,00,000 Tk For 6 Months, • Flat, • 3 Country Tour |
| **7. Asst. Director** | 2x General Manager | 2x General Manager | • Lifetime Salary 10,00,000 Tk, • Car (1cr), • Duplex Villa (10 Katha), • Full family Europe Tour |

---

## Turn 4

**User:** 
Egulo to ache but ekhane ekta jinish hoilo slot e jemon dhoro amar niche ache A + B, ekhn A korlo 5 lac r B 3 lac invest korlo tokhn ekhane kon level er comission diba? Ekhane macting system e hbe naki jeita match hbe oitar comission pabe baki ta flash hbe theke jabe pore abar invesment e naki milbe ba emn kichu hbe bujcho?

**Gemini:**
A (5 Lac) + B (3 Lac) এর ক্ষেত্রে টিম কমিশন (5%) দেওয়ার জন্য সফটওয়্যারে ৩টি লজিক হতে পারে:
1. **Binary Matching + Carry Forward:** ছোট লেগের সমপরিমাণ (3 Lac) ম্যাচ করবে, 3 Lac-এর 5% = 15,000 Tk কমিশন পাবে। বাকি 2 Lac A-লেগে Carry Forward জমা থাকবে।
2. **Binary Matching + Flush Out:** 3 Lac ম্যাচ করে 15,000 Tk পাবে, বাকি 2 Lac Flush (০) হয়ে যাবে।
3. **Direct Unilevel Collection:** কোনো ম্যাচিং থাকবে না, মোট ৮ লাখ টাকার ওপর সরাসরি ৫% (৪০,০০০ টাকা) চলে যাবে (লেভেল ডিস্ট্রিবিউশন লজিক প্রয়োজন)।

---

## Turn 5

**User:** 
Tmi rank bad dew apatot rank pore hisabbkorbo

**Gemini:**
র‍্যাংক বাদ দিয়ে শুধুমাত্র **Direct (6%)** এবং **Team Commission (5%)** এর হিসাব:
* **Direct Referral (6%):** A (5 Lac) থেকে ৩০,০০০ Tk এবং B (3 Lac) থেকে ১৮,০০০ Tk সরাসরি C-Wallet-এ যাবে।
* **Team Commission (5%):** Binary Matching + Carry Forward নিয়ম অনুসরণে A ও B এর মধ্যে ৩ লাখ টাকার ম্যাচিং অনুষ্ঠিত হবে।

---

## Turn 6

**User:** 
Slot onujai match korbe baki taka carry fotwaord hisabe joma thakbe pore onno invest e match korbe bujcho? *(Attached Image 4: Full List of 9 Investment Slot Options)*

**Gemini:**
ইনভেস্টমেন্টের মোট **৯টি স্লট**:
`[10,00,000 | 50,00,000 | 20,00,000 | 10,00,000 | 5,00,000 | 2,00,000 | 1,00,000 | 50,000 | 10,000]`

**ম্যাচিং ফ্লো (A = 5 Lac, B = 3 Lac):**
* দুই পাশের মোট ৩ লাখ টাকা মিলবে।
* সফটওয়্যার ২টি নিয়মে ম্যাচ করাতে পারে:
  * **Rule A (Step Matching):** প্রথমে ২ লাখ স্লট এবং পরে ১ লাখ স্লট পর পর ম্যাচ করবে।
  * **Rule B (Direct Volume Matching):** ৩ লাখ ভলিউমের ওপর সরাসরি ৫% = ১৫,০০০ Tk কমিশন দেবে।
* A-পাশে বাকি ২ লাখ টাকা Carry Forward সেভ থাকবে।

---

## Turn 7

**User:** 
Ekhane ekta important point ache 3 lac 5lac er slot e e match bai kono match holo 2 lac e tokhn ki 2 lac march kore baki taka ki hbe etar option ta jana lagbe jemon er niche jmn 1 lac er slot ache oita milbe mane aste aste nicher slot khujbe bujcho?

**Gemini:**
এটি কম্পিউটার সায়েন্সের **"Greedy Algorithm"**-এর মাধ্যমে বাস্তবায়ন করা সম্ভব:
* **Option 1 (Cascading / Step-Down Match):** A = 5L, B = 3L হলে প্রথমে 2 Lac স্লট মিলবে (কমিশন: ১০,০০০ Tk), তারপর নিচে নেমে 1 Lac স্লট মিলবে (কমিশন: ৫,০০০ Tk)। মোট ১৫,০০০ Tk কমিশন পাবে এবং A-তে ২ লাখ জমা থাকবে।
* **Option 2 (Single Highest Match Only):** একবারে শুধুমাত্র সর্বোচ্চ একটি স্লট (2 Lac) মিলবে (কমিশন: ১০,০০০ Tk)। বাকি A = 3 Lac এবং B = 1 Lac উভয় পক্ষেই জমা থাকবে।

---

## Turn 8

**User:** 
Ki ki pblm chilo jeno clint theke clear howar dorkar chilo

**Gemini:**
ক্লায়েন্ট থেকে ক্লিয়ার হওয়ার চেকলিস্ট:
1. **স্লট ম্যাচিং লজিক:** ক্যাসকেডিং (নিচে নেমে ভাঙা) নাকি সিঙ্গেল সর্বোচ্চ স্লট ম্যাচিং?
2. **ট্রি প্লেসমেন্ট:** ইউজার নিজে Left/Right বাছবে নাকি অটো-প্লেসমেন্ট (Auto Left-to-Right)?
3. **ওয়ালেট স্ট্রাকচার:** E, G, C, R, T ওয়ালেটের স্পষ্ট পার্থক্য ও ডিপোজিট/উইথড্র ফ্লো।
4. **ROI ফ্রিকোয়েন্সি:** ১৮ মাসের ১১,১১১ টাকা কি মাস শেষে নাকি প্রতিদিন ভাগ হয়ে ঢুকবে?
5. **র‍্যাংক কোয়ালিফিকেশন:** Left/Right লেগ ব্যালেন্সের সুনির্দিষ্ট নিয়ম।

---

## Turn 9

**User:** 
ei obdi joto msg ami tmake dichi joto msg tmi amake dicho etar ekta document file kore dew .md file er moddhe

**Gemini:**
*(Generated full markdown log document)*

---

## Turn 10

**User:** 
r ekta jinish add koro ekhane match na korle pabe na mane A lac r B 3 lac hole pabe na exat match hole 5 lac B 5 lac r nicheo match hbe na bujcho kina bolo age

**Gemini:**
**Exact / Equal Matching (1:1 Strict Matching Rules):**
* **অমিল অবস্থায় পেন্ডিং (0 Commission):** যদি A = 5 Lac এবং B = 3 Lac হয়, তবে কোনো স্লট বা পারশিয়াল ম্যাচিং হবে না। ইউজার ০ টাকা কমিশন পাবে। উভয় অ্যামাউন্ট জমা থাকবে।
* **হুবহু সমান হলেই ম্যাচ:** যখন B-তে নতুন ২ লাখ যোগ হয়ে B = 5 Lac হবে, তখন `A (5 Lac) == B (5 Lac)` মেলায় সরাসরি **5,00,000 Tk স্লট ম্যাচ** করবে এবং ইউজার ২৫,০০০ টাকা (৫%) কমিশন পাবে।
* ম্যাচ হওয়ার পর উভয় সাইডের ব্যালেন্স ০ হয়ে যাবে।

---

## Updated Client Clarification Checklist

১. **ম্যাচিং টাইপ (Exact Equal Match vs Flexible Match):** 
   - দুই পাশে হুবহু সমান স্লট বা অ্যামাউন্ট (যেমন: A = 5L & B = 5L) হতে হবে? অমিল থাকলে কি ০% কমিশন এবং হোল্ড থাকবে?
২. **অতিরিক্ত ভলিউম হ্যান্ডলিং:** 
   - A-তে ৫ লাখ এবং B-তে ৩ লাখের পর যদি নতুন করে একজন B-তে ৫ লাখ ইনভেস্ট করে (ফলে B = ৮ লাখ হয়), তবে কি ৫ লাখ ম্যাচ করে B-তে ৩ লাখ জমা থাকবে?
৩. **Tree Placement:** 
   - ইউজার নিজে Left/Right সিলেক্ট করবে নাকি সিস্টেম অটো-প্লেস করবে?
৪. **ROI Credit Timeline:** 
   - ১১,১১১ টাকা প্রতি ৩০ দিন পর একসাথে জমা হবে, নাকি প্রতিদিন হিসাব হয়ে ঢোকার সুযোগ থাকবে?