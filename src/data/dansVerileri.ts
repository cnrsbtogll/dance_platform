// src/data/dansVerileri.ts

// Tip tanımlamaları
interface DansOkulu {
  id: number;
  ad: string;
  aciklama: string;
  konum: string;
  iletisim: string;
  telefon: string;
  gorsel: string;
}

interface DansEgitmeni {
  id: number;
  ad: string;
  uzmanlık: string;
  tecrube: string;
  biyografi: string;
  okul_id: number;
  gorsel: string;
}

interface DansKursu {
  id: number;
  baslik: string;
  aciklama: string;
  seviye: string;
  süre: string;
  fiyat: string;
  kapasite: number;
  gun: string;
  saat: string;
  egitmen_id: number;
  okul_id: number;
  gorsel: string;
}

interface DansRozeti {
  id: number;
  ad: string;
  aciklama: string;
  seviye: number;
  gorsel: string;
}

interface DansTip {
  id: number;
  baslik: string;
  aciklama: string;
}

// Dansçı verisi objesi
const dansOkullari: DansOkulu[] = [
  {
    id: 1,
    ad: "Salsa Ankara Dans Akademi",
    aciklama: "İstanbul'un kalbinde yer alan dans akademisi, 20 yıllık tecrübesiyle her seviyede dans dersleri sunmaktadır.",
    konum: "Çankaya, Ankara",
    iletisim: "info@salsaankara.com",
    telefon: "0312 555 1234",
    gorsel: "/assets/images/dance/okul1.jpg"
  },
  {
    id: 2,
    ad: "La Dans Akademi",
    aciklama: "Profesyonel eğitmenler eşliğinde kaliteli dans eğitimi alın.",
    konum: "Kadıköy, İstanbul",
    iletisim: "iletisim@ladans.com",
    telefon: "0216 555 6789",
    gorsel: "/assets/images/dance/okul2.jpg"
  },
  {
    id: 3,
    ad: "Güney Gümüş Dans Akademi",
    aciklama: "Her yaş grubu için çeşitli dans stillerinde dersler ve workshoplar.",
    konum: "Muratpaşa, Antalya",
    iletisim: "guneydans@gmail.com",
    telefon: "0242 555 9012",
    gorsel: "/assets/images/dance/okul3.jpg"
  },
  {
    id: 4,
    ad: "Latino Dans Akademi",
    aciklama: "Dans, müzik ve sanatın buluştuğu nokta.",
    konum: "Karşıyaka, İzmir",
    iletisim: "latino@latinodans.com",
    telefon: "0232 555 3456",
    gorsel: "/assets/images/dance/okul4.jpg"
  },
  {
    id: 5,
    ad: "Angora Dans Akademi",
    aciklama: "Antalya'nın en büyük salsa ve latin dansları okulu.",
    konum: "Keçiören, Ankara",
    iletisim: "iletisim@angoradans.com",
    telefon: "0312 555 7890",
    gorsel: "/assets/images/dance/okul5.jpg"
  }
];

const dansEgitmenleri: DansEgitmeni[] = [
  {
    id: 1,
    ad: "Seçil & Yunus",
    uzmanlık: "Kizomba",
    tecrube: "8 yıl",
    biyografi: "Seçil ve Yunus, 8 yıldır birlikte dans eden ve Türkiye'nin önde gelen Kizomba eğitmenlerindendir. Urbankiz ve geleneksel Kizomba stilleri konusunda uzmanlaşmış olan çift, uluslararası festivallerde ders vermekte ve yarışmalarda ülkemizi başarıyla temsil etmektedir.",
    okul_id: 1,
    gorsel: "/assets/images/dance/egitmen1.jpg"
  },
  {
    id: 2,
    ad: "Gökhan & Derya",
    uzmanlık: "Kizomba",
    tecrube: "6 yıl",
    biyografi: "Gökhan ve Derya, Kizomba Fusion stilinde uzmanlaşmış bir çifttir. Teknik detaylara verdikleri önemle tanınan ikili, öğrencilerine dans temellerini en ince ayrıntısına kadar öğretmek için özel metodolojiler geliştirmiştir.",
    okul_id: 1,
    gorsel: "/assets/images/dance/egitmen2.jpg"
  },
  {
    id: 3,
    ad: "Furkan & Buse",
    uzmanlık: "Bachata",
    tecrube: "7 yıl",
    biyografi: "Furkan ve Buse, duygusal ve akıcı figürleriyle tanınan bir Bachata çiftidir. Sensual Bachata'nın Türkiye'deki önemli temsilcilerinden olan ikili, birçok uluslararası festivalde workshop vermiş ve ülkemizi başarıyla temsil etmiştir.",
    okul_id: 2,
    gorsel: "/assets/images/dance/egitmen3.jpg"
  },
  {
    id: 4,
    ad: "Harun İşkar",
    uzmanlık: "Salsa",
    tecrube: "10 yıl",
    biyografi: "Harun İşkar, Küba tarzı Salsa ve Rueda de Casino konusunda uzmanlaşmış deneyimli bir eğitmendir. Enerjik dans stili ve yaratıcı figürleriyle tanınan Harun, 2020 Avrupa Salsa Şampiyonası'nda ülkemize 3.lük derecesi kazandırmıştır.",
    okul_id: 3,
    gorsel: "/assets/images/dance/egitmen4.jpg"
  },
  {
    id: 5,
    ad: "Mehmet Yılmaz",
    uzmanlık: "Salsa",
    tecrube: "12 yıl",
    biyografi: "Mehmet, LA style Salsa ve solo shine hareketleri konusunda uzmanlaşmış deneyimli bir eğitmendir. 12 yıllık dans kariyeri boyunca 100'den fazla uluslararası workshop'ta eğitmenlik yapmış ve kendi özgün dans stilini geliştirmiştir.",
    okul_id: 4,
    gorsel: "/assets/images/dance/egitmen5.jpg"
  },
  {
    id: 6,
    ad: "Zeynep Güler",
    uzmanlık: "Bachata",
    tecrube: "5 yıl",
    biyografi: "Zeynep ve Can, Modern Bachata ve Dominikan stili Bachata konusunda uzmanlaşmış genç ve dinamik bir çifttir. Türkiye Bachata Festivali'nin kurucuları olan ikili, ülkemizde Bachata'nın yaygınlaşmasına önemli katkılarda bulunmuştur.",
    okul_id: 5,
    gorsel: "/assets/images/dance/egitmen6.jpg"
  },
  {
    id: 7,
    ad: "Elif Düzenli",
    uzmanlık: "Kizomba",
    tecrube: "9 yıl",
    biyografi: "Elif, lady styling ve teknik temel eğitimi konusunda uzmanlaşmış deneyimli bir Kizomba eğitmenidir. Angola'dan aldığı özel eğitmenlik sertifikasıyla, Kizomba'nın kökenine sadık kalarak modern stilleri harmanlayan bir öğretim metodolojisi geliştirmiştir.",
    okul_id: 1,
    gorsel: "/assets/images/dance/egitmen7.jpg"
  }
];

const dansKurslari: DansKursu[] = [
  {
    id: 1,
    baslik: "Başlangıç Seviye Salsa",
    aciklama: "Salsa dansının temel adımları ve figürleri öğretilir. Dans duruşu, müzik ritmi ve partner ile uyum gibi konular ele alınır. Kurs sonunda temel figürleri uygulayabilecek ve basit kombinasyonlar yapabilecek seviyeye gelirsiniz.",
    seviye: "Başlangıç",
    süre: "8 hafta",
    fiyat: "1200 TL",
    kapasite: 20,
    gun: "Pazartesi, Çarşamba",
    saat: "19:00 - 20:30",
    egitmen_id: 4,
    okul_id: 1,
    gorsel: "/assets/images/dance/kurs1.jpg"
  },
  {
    id: 2,
    baslik: "Orta Seviye Bachata",
    aciklama: "Bachata dansının orta seviye figürleri ve sensual hareketleri öğretilir. Vücut izolasyonu, müzik yorumlama ve partner bağlantısı konuları derinlemesine incelenir. Kursta öğreneceğiniz kombinasyonlar ile dans partilerinde rahatça dans edebilir seviyeye geleceksiniz.",
    seviye: "Orta",
    süre: "10 hafta",
    fiyat: "1500 TL",
    kapasite: 15,
    gun: "Salı, Perşembe",
    saat: "20:00 - 21:30",
    egitmen_id: 3,
    okul_id: 2,
    gorsel: "/assets/images/dance/kurs2.jpg"
  },
  {
    id: 3,
    baslik: "İleri Seviye Kizomba",
    aciklama: "Urbankiz ve Geleneksel Kizomba stillerinin ileri seviye figürleri öğretilir. Karmaşık müzik yorumlama, gelişmiş beden dili ve etkileyici kombinasyonlar üzerine çalışılır. Kurs sonunda uluslararası dans partilerinde kendinizi rahatça ifade edebilecek seviyeye geleceksiniz.",
    seviye: "İleri",
    süre: "12 hafta",
    fiyat: "1800 TL",
    kapasite: 16,
    gun: "Cuma, Pazar",
    saat: "19:00 - 21:00",
    egitmen_id: 1,
    okul_id: 3,
    gorsel: "/assets/images/dance/kurs3.jpg"
  },
  {
    id: 4,
    baslik: "Salsa Shines & Styling",
    aciklama: "Salsa'da solo hareketlere odaklanan bu kursta LA ve Cuban stili shine figürleri öğretilir. Kadın ve erkek dansçılar için özel styling teknikleri, footwork ve beden dili konuları ele alınır. Kurs sonunda partner olmadan da dans pistinde etkileyici performans sergileyebileceksiniz.",
    seviye: "Karma",
    süre: "6 hafta",
    fiyat: "1100 TL",
    kapasite: 20,
    gun: "Cumartesi",
    saat: "14:00 - 16:00",
    egitmen_id: 5,
    okul_id: 4,
    gorsel: "/assets/images/dance/kurs4.jpg"
  },
  {
    id: 5,
    baslik: "Bachata Dominicana",
    aciklama: "Bachata'nın kökeni olan Dominik tarzı figürler ve otantik hareketler öğretilir. Geleneksel adım varyasyonları, omuz hareketleri ve doğru müzik yorumlama teknikleri üzerinde durulur. Kurs sonunda Dominikan stilinde özgün bachata performansı sergileyebileceksiniz.",
    seviye: "Orta-İleri",
    süre: "8 hafta",
    fiyat: "1400 TL",
    kapasite: 15,
    gun: "Çarşamba",
    saat: "19:30 - 21:00",
    egitmen_id: 6,
    okul_id: 5,
    gorsel: "/assets/images/dance/kurs5.jpg"
  },
  {
    id: 6,
    baslik: "Kizomba Lady Styling",
    aciklama: "Kadın dansçılar için özel olarak tasarlanmış bu kursta, kizomba dansında zarafet ve stil üzerine çalışılır. Vücut izolasyonu, bacak hareketleri, duruş ve partner ile estetik uyum konuları ele alınır. Kurs sonunda kizomba dansınıza zarif detaylar ekleyebilecek seviyeye geleceksiniz.",
    seviye: "Orta",
    süre: "6 hafta",
    fiyat: "1100 TL",
    kapasite: 15,
    gun: "Pazar",
    saat: "12:00 - 14:00",
    egitmen_id: 7,
    okul_id: 1,
    gorsel: "/assets/images/dance/kurs6.jpg"
  },
  {
    id: 7,
    baslik: "Salsa Rueda de Casino",
    aciklama: "Küba tarzı salsa olan Rueda de Casino'nun grup olarak uygulanışı öğretilir. Çember formasyonunda, komutlarla değişen eşler ve figürlerle dans edilir. Sosyal ve eğlenceli bir dans deneyimi sunan bu kursta, 30'dan fazla Rueda figürü ve komutu öğreneceksiniz.",
    seviye: "Karma",
    süre: "10 hafta",
    fiyat: "1300 TL",
    kapasite: 20,
    gun: "Pazar",
    saat: "18:00 - 20:00",
    egitmen_id: 4,
    okul_id: 2,
    gorsel: "/assets/images/dance/kurs7.jpg"
  },
  {
    id: 8,
    baslik: "Çiftler için Bachata",
    aciklama: "Çiftler için özel olarak tasarlanmış bu kurs, birlikte dans etmeyi öğrenmek isteyen çiftlere yöneliktir. Partner uyumu, iletişim ve temel bachata figürleri öğretilir. Kurs sonunda çift olarak uyumlu ve keyifli bachata dansı yapabilecek seviyeye geleceksiniz.",
    seviye: "Başlangıç",
    süre: "8 hafta",
    fiyat: "1600 TL",
    kapasite: 12,
    gun: "Cuma",
    saat: "19:00 - 20:30",
    egitmen_id: 3,
    okul_id: 3,
    gorsel: "/assets/images/dance/kurs8.jpg"
  },
  {
    id: 9,
    baslik: "Breakdance Temelleri",
    aciklama: "Breakdance'in temel hareketlerini ve tekniklerini öğrenin, kendi tarzınızı oluşturun.",
    seviye: "Başlangıç-Orta",
    süre: "8 hafta",
    fiyat: "1200 TL",
    kapasite: 15,
    gun: "Cumartesi, Pazar",
    saat: "16:00 - 17:30",
    egitmen_id: 3,
    okul_id: 2,
    gorsel: "/assets/images/dance/kurs9.jpg"
  },
  {
    id: 10,
    baslik: "Çiftler İçin Vals",
    aciklama: "Düğün ve özel geceler için vals dansını öğrenin, zarif ve etkileyici olun.",
    seviye: "Tüm Seviyeler",
    süre: "4 hafta",
    fiyat: "900 TL",
    kapasite: 10,
    gun: "Cuma",
    saat: "18:00 - 19:30",
    egitmen_id: 4,
    okul_id: 3,
    gorsel: "/assets/images/dance/kurs10.jpg"
  },
  {
    id: 11,
    baslik: "Kizomba Fusion Workshop",
    aciklama: "Gökhan ve Derya ile Kizomba Fusion tekniklerini öğreneceğiniz yoğunlaştırılmış bir workshop. Kizomba'nın temel adımlarını modern dans stilleriyle harmanlayarak özgün bir dans deneyimi yaşayacaksınız. Teknik detaylar, müzikal yorumlama ve partner bağlantısı üzerine derinlemesine çalışmalar yapılacak.",
    seviye: "Orta-İleri",
    süre: "2 hafta",
    fiyat: "950 TL",
    kapasite: 12,
    gun: "Cumartesi, Pazar",
    saat: "13:00 - 16:00",
    egitmen_id: 2,
    okul_id: 1,
    gorsel: "/assets/images/dance/kurs2.jpg"
  }
];

const dansRozet: DansRozeti[] = [
  {
    id: 1,
    ad: "Dans Başlangıç",
    aciklama: "İlk dans kursunu tamamladınız!",
    seviye: 1,
    gorsel: "/assets/images/dance/rozet1.jpg"
  },
  {
    id: 2,
    ad: "Ritim Ustası",
    aciklama: "Müziği hissediyor ve ritimle hareket edebiliyorsunuz.",
    seviye: 2,
    gorsel: "/assets/images/dance/rozet2.jpg"
  },
  {
    id: 3,
    ad: "Adım Uzmanı",
    aciklama: "Karmaşık adım kombinasyonlarını başarıyla uygulayabiliyorsunuz.",
    seviye: 3,
    gorsel: "/assets/images/dance/rozet3.jpg"
  },
  {
    id: 4,
    ad: "Dans Yıldızı",
    aciklama: "Dans pistinde göz kamaştırıyorsunuz!",
    seviye: 4,
    gorsel: "/assets/images/dance/rozet4.jpg"
  },
  {
    id: 5,
    ad: "Dans Şampiyonu",
    aciklama: "Artık bir dans şampiyonusunuz, tebrikler!",
    seviye: 5,
    gorsel: "/assets/images/dance/rozet5.jpg"
  }
];

const danceTips: DansTip[] = [
  {
    id: 1,
    baslik: "Doğru Dans Ayakkabısı Seçimi",
    aciklama: "Dans stilinize uygun ayakkabı seçimi performansınızı önemli ölçüde etkileyebilir."
  },
  {
    id: 2,
    baslik: "Dans Öncesi Isınma",
    aciklama: "Dans etmeden önce mutlaka 10-15 dakika ısınma hareketleri yapın, sakatlanma riskinizi azaltın."
  },
  {
    id: 3,
    baslik: "Dengede Kalma",
    aciklama: "Denge için karın kaslarınızı hafifçe sıkın ve ağırlık merkezinizi kontrol edin."
  },
  {
    id: 4,
    baslik: "Müziği Hissedin",
    aciklama: "Sadece adımları saymak yerine, müziğin ritmini hissetmeye çalışın."
  },
  {
    id: 5,
    baslik: "Düzenli Pratik",
    aciklama: "Dans becerilerinizi geliştirmek için düzenli olarak pratik yapın, haftada en az 3 kez."
  }
];

export { dansOkullari, dansEgitmenleri, dansKurslari, dansRozet, danceTips }; 