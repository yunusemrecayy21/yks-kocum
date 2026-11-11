export type ExamCategory = 'TYT' | 'AYT' | 'YDT';

export type KanbanColumnId = 'todo' | 'in_progress' | 'done';

export interface CurriculumTopic {
  id: string;
  order: number;
  title: string;
  subjectId: string;
  subjectName: string;
  examType: ExamCategory;
}

export interface CurriculumSubject {
  id: string;
  examType: ExamCategory;
  name: string;
  questionCount: number;
  topicCount: number;
  topics: CurriculumTopic[];
}

interface RawSubjectDefinition {
  id: string;
  examType: ExamCategory;
  name: string;
  questionCount: number;
  expectedTopicCount: number;
  topics: readonly string[];
}

const RAW_SUBJECTS: readonly RawSubjectDefinition[] = [
  // =========================================================
  // TYT — Temel Yeterlilik Testi (10 ders · 200 konu)
  // =========================================================
  {
    id: 'tyt-turkce',
    examType: 'TYT',
    name: 'Türkçe',
    questionCount: 40,
    expectedTopicCount: 26,
    topics: [
      'Sözcükte Anlam',
      'Söz Yorumu',
      'Deyim ve Atasözü',
      'Cümlede Anlam',
      'Paragrafta Anlatım Teknikleri',
      'Paragrafta Düşünceyi Geliştirme Yolları',
      'Paragrafta Yapı',
      'Paragrafta Konu-Ana Düşünce',
      'Paragrafta Yardımcı Düşünce',
      'Ses Bilgisi',
      'Yazım Kuralları',
      'Noktalama İşaretleri',
      'Sözcükte Yapı/Ekler',
      'İsimler',
      'Zamirler',
      'Sıfatlar',
      'Zarflar',
      'Edat-Bağlaç-Ünlem',
      'Fiilde Anlam (Kip-Kişi-Yapı)',
      'Ek Fiil',
      'Fiilimsi',
      'Fiilde Çatı',
      'Sözcük Grupları',
      'Cümlenin Ögeleri',
      'Cümle Türleri',
      'Anlatım Bozukluğu'
    ]
  },
  {
    id: 'tyt-matematik',
    examType: 'TYT',
    name: 'Matematik',
    questionCount: 30,
    expectedTopicCount: 32,
    topics: [
      'Temel Kavramlar',
      'Sayı Basamakları',
      'Bölme ve Bölünebilme',
      'EBOB-EKOK',
      'Rasyonel Sayılar',
      'Basit Eşitsizlikler',
      'Mutlak Değer',
      'Üslü Sayılar',
      'Köklü Sayılar',
      'Çarpanlara Ayırma',
      'Oran Orantı',
      'Denklem Çözme',
      'Sayı Problemleri',
      'Kesir Problemleri',
      'Yaş Problemleri',
      'Hareket Hız Problemleri',
      'İşçi Emek Problemleri',
      'Yüzde Problemleri',
      'Kâr Zarar Problemleri',
      'Karışım Problemleri',
      'Grafik Problemleri',
      'Rutin Olmayan Problemler',
      'Kümeler-Kartezyen Çarpım',
      'Mantık',
      'Fonksiyonlar',
      'Polinomlar',
      '2. Dereceden Denklemler',
      'Permütasyon ve Kombinasyon',
      'Olasılık',
      'Veri-İstatistik',
      'Algoritma ve Bilişim',
      'İstatistiksel Araştırma Süreci ve Veriden Olasılığa'
    ]
  },
  {
    id: 'tyt-geometri',
    examType: 'TYT',
    name: 'Geometri',
    questionCount: 10,
    expectedTopicCount: 34,
    topics: [
      'Temel Kavramlar',
      'Doğruda Açılar',
      'Üçgende Açılar',
      'Özel Üçgenler',
      'Dik Üçgen',
      'İkizkenar Üçgen',
      'Eşkenar Üçgen',
      'Açıortay',
      'Kenarortay',
      'Eşlik ve Benzerlik',
      'Üçgende Alan',
      'Üçgende Benzerlik',
      'Açı Kenar Bağıntıları',
      'Çokgenler',
      'Dörtgenler',
      'Deltoid',
      'Paralelkenar',
      'Eşkenar Dörtgen',
      'Dikdörtgen',
      'Kare',
      'Yamuk',
      'Çemberde Açı',
      'Çemberde Uzunluk',
      'Dairede Çevre ve Alan',
      'Noktanın Analitiği',
      'Doğrunun Analitiği',
      'Dönüşüm Geometrisi',
      'Çemberin Analitiği',
      'Prizmalar',
      'Küp',
      'Silindir',
      'Piramit',
      'Koni',
      'Küre'
    ]
  },
  {
    id: 'tyt-fizik',
    examType: 'TYT',
    name: 'Fizik',
    questionCount: 7,
    expectedTopicCount: 16,
    topics: [
      'Fizik Bilimine Giriş',
      'Madde ve Özellikleri',
      'Sıvıların Kaldırma Kuvveti',
      'Basınç',
      'Isı, Sıcaklık ve Genleşme',
      'Hareket ve Kuvvet',
      'Dinamik',
      'İş, Güç ve Enerji',
      'Elektrik',
      'Manyetizma',
      'Dalgalar',
      'Optik',
      'Deprem',
      'Nükleer Santraller',
      'Deniz Araçları',
      'Kariyer Keşfi ve Sürdürülebilirlik'
    ]
  },
  {
    id: 'tyt-kimya',
    examType: 'TYT',
    name: 'Kimya',
    questionCount: 7,
    expectedTopicCount: 13,
    topics: [
      'Kimya Bilimi',
      'Atom ve Periyodik Sistem',
      'Kimyasal Türler Arası Etkileşimler',
      'Maddenin Halleri',
      'Doğa ve Kimya',
      'Kimyanın Temel Kanunları',
      'Kimyasal Hesaplamalar',
      'Karışımlar',
      'Asit, Baz ve Tuz',
      'Kimya Her Yerde',
      'Yeşil Kimya',
      'Nanoteknoloji',
      'Kimya Hayattır ve Kariyer'
    ]
  },
  {
    id: 'tyt-biyoloji',
    examType: 'TYT',
    name: 'Biyoloji',
    questionCount: 6,
    expectedTopicCount: 12,
    topics: [
      'Canlıların Ortak Özellikleri',
      'Canlıların Temel Bileşenleri',
      'Hücre ve Organelleri',
      'Hücre Zarından Madde Geçişi',
      'Canlıların Sınıflandırılması',
      'Mitoz ve Eşeysiz Üreme',
      'Mayoz ve Eşeyli Üreme',
      'Kalıtım',
      'Ekosistem Ekolojisi',
      'Güncel Çevre Sorunları',
      'Sıfır Atık',
      'Ekolojik Ayak İzi'
    ]
  },
  {
    id: 'tyt-tarih',
    examType: 'TYT',
    name: 'Tarih',
    questionCount: 5,
    expectedTopicCount: 23,
    topics: [
      'Tarih ve Zaman',
      'İnsanlığın İlk Dönemleri',
      "Orta Çağ'da Dünya",
      'İlk ve Orta Çağlarda Türk Dünyası',
      'İslam Medeniyetinin Doğuşu',
      "Türklerin İslamiyet'i Kabulü ve İlk Türk İslam Devletleri",
      'Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi',
      'Beylikten Devlete Osmanlı Siyaseti',
      'Devletleşme Sürecinde Savaşçılar ve Askerler',
      'Beylikten Devlete Osmanlı Medeniyeti',
      'Dünya Gücü Osmanlı',
      'Sultan ve Osmanlı Merkez Teşkilatı',
      'Klasik Çağda Osmanlı Toplum Düzeni',
      'Değişen Dünya Dengeleri Karşısında Osmanlı Siyaseti',
      'Değişim Çağında Avrupa ve Osmanlı',
      'Uluslararası İlişkilerde Denge Stratejisi (1774-1914)',
      'Devrimler Çağında Değişen Devlet-Toplum İlişkileri',
      'Sermaye ve Emek',
      'XIX. ve XX. Yüzyılda Değişen Gündelik Hayat',
      'XX. Yüzyıl Başlarında Osmanlı Devleti ve Dünya',
      'Milli Mücadele',
      'Atatürkçülük ve Türk İnkılabı',
      'Geçmişin İnşa Sürecinde Tarih'
    ]
  },
  {
    id: 'tyt-cografya',
    examType: 'TYT',
    name: 'Coğrafya',
    questionCount: 5,
    expectedTopicCount: 21,
    topics: [
      'Doğa ve İnsan',
      "Dünya'nın Şekli ve Hareketleri",
      'Coğrafi Konum',
      'Harita Bilgisi',
      'Atmosfer ve Sıcaklık',
      'İklimler',
      'Basınç ve Rüzgarlar',
      'Nem, Yağış ve Buharlaşma',
      'İç Kuvvetler / Dış Kuvvetler',
      'Su-Toprak ve Bitkiler',
      'Nüfus',
      'Göç',
      'Yerleşme',
      "Türkiye'nin Yer Şekilleri",
      'Ekonomik Faaliyetler',
      'Bölgeler',
      'Uluslararası Ulaşım Hatları',
      'Çevre ve Toplum',
      'Doğal Afetler',
      'CBS (Coğrafi Bilgi Sistemleri)',
      'Afetler ve Sürdürülebilir Çevre'
    ]
  },
  {
    id: 'tyt-felsefe',
    examType: 'TYT',
    name: 'Felsefe',
    questionCount: 5,
    expectedTopicCount: 13,
    topics: [
      'Felsefenin Konusu',
      'Bilgi Felsefesi',
      'Varlık Felsefesi',
      'Ahlak Felsefesi',
      'Sanat Felsefesi',
      'Din Felsefesi',
      'Siyaset Felsefesi',
      'Bilim Felsefesi',
      'İlk Çağ Felsefesi',
      '2. Yüzyıl ve 15. Yüzyıl Felsefeleri',
      '15. Yüzyıl ve 17. Yüzyıl Felsefeleri',
      '18. Yüzyıl ve 19. Yüzyıl Felsefeleri',
      '20. Yüzyıl Felsefesi'
    ]
  },
  {
    id: 'tyt-din-kulturu',
    examType: 'TYT',
    name: 'Din Kültürü',
    questionCount: 5,
    expectedTopicCount: 10,
    topics: [
      'Bilgi ve İnanç',
      'İslam ve İbadet',
      'Ahlak ve Değerler',
      'Allah-İnsan İlişkisi',
      'Hz. Muhammed (S.A.V.)',
      'Vahiy ve Akıl',
      'İslam Düşüncesinde Yorumlar, Mezhepler',
      'Din, Kültür ve Medeniyet',
      'İslam ve Bilim, Estetik, Barış',
      'Yaşayan Dinler'
    ]
  },

  // =========================================================
  // AYT — Alan Yeterlilik Testi (12 ders · 322 konu)
  // =========================================================
  {
    id: 'ayt-turk-dili-ve-edebiyati',
    examType: 'AYT',
    name: 'Türk Dili ve Edebiyatı',
    questionCount: 24,
    expectedTopicCount: 26,
    topics: [
      'Hikaye',
      'Şiir',
      'Masal',
      'Fabl',
      'Roman',
      'Tiyatro',
      'Biyografi',
      'Otobiyografi',
      'Mektup',
      'E-Posta',
      'Günlük',
      'Blog',
      'Destan',
      'Efsane',
      'Anı',
      'Hatıra',
      'Haber Metni',
      'Gezi Yazısı',
      'Makale',
      'Sohbet ve Fıkra',
      'Eleştiri',
      'Mülakat',
      'Röportaj',
      'Deneme',
      'Söylev',
      'Nutuk'
    ]
  },
  {
    id: 'ayt-matematik',
    examType: 'AYT',
    name: 'Matematik',
    questionCount: 30,
    expectedTopicCount: 40,
    topics: [
      'Kümelerde Temel Kavramlar',
      'Kümelerde İşlemler',
      'Gerçek Sayılar',
      'Birinci Dereceden Denklem ve Eşitsizlikler',
      'Üslü İfadeler ve Denklemler',
      'Denklem ve Eşitsizliklerle İlgili Uygulamalar',
      'Fonksiyon Kavramı ve Gösterimi',
      'Merkezi Eğilim ve Yayılım Ölçüleri',
      'Verilerin Grafikle Gösterilmesi',
      'Basit Olayların Olasılıkları',
      'Sıralama ve Seçme',
      'Fonksiyonların Simetrileri ve Cebirsel Özellikleri',
      'İki Fonksiyonun Bileşkesi ve Bir Fonksiyonun Tersi',
      'İkinci Dereceden Bir Bilinmeyenli Denklemler',
      'Polinom Kavramı ve Polinomlarla İşlemler',
      'Polinomlarda Çarpanlara Ayırma',
      'Polinom ve Rasyonel Denklemlerin Çözüm Kümeleri',
      'Yönlü Açılar',
      'Trigonometrik Fonksiyonlar',
      'Doğrunun Analitik İncelenmesi',
      'Fonksiyonlarla İlgili Uygulamalar',
      'İkinci Dereceden Fonksiyonlar ve Grafikleri',
      'Fonksiyonların Dönüşümleri',
      'İkinci Dereceden İki Bilinmeyenli Denklem Sistemleri',
      'İkinci Dereceden Bir Bilinmeyenli Eşitsizlikler ve Eşitsizlik Sistemleri',
      'Koşullu Olasılık',
      'Deneysel ve Teorik Olasılık',
      'Üstel Fonksiyonlar',
      'Logaritma Fonksiyonu',
      'Üstel ve Logaritmik Denklem ve Eşitsizlikler',
      'Gerçek Sayı Dizileri',
      'Limit ve Süreklilik',
      'Anlık Değişim Oranı ve Türev',
      'Türevin Uygulamaları',
      'Belirsiz İntegral',
      'Belirli İntegral ve Uygulamaları',
      'Toplam-Fark ve İki Kat Açı Formülleri',
      'Trigonometrik Denklemler',
      'Analitik Düzlemde Temel Dönüşümler',
      'Çemberin Analitik İncelenmesi'
    ]
  },
  {
    id: 'ayt-geometri',
    examType: 'AYT',
    name: 'Geometri',
    questionCount: 10,
    expectedTopicCount: 27,
    topics: [
      'Doğruda Açılar',
      'Üçgende Açılar',
      'Özel Üçgenler',
      'İkizkenar Üçgen',
      'Eşkenar Üçgen',
      'Açı Kenar Bağıntıları',
      'Üçgenlerin Eşliği',
      'Üçgenlerin Benzerliği',
      'Üçgenin Yardımcı Elemanları',
      'Dik Üçgen ve Trigonometri',
      'Üçgenin Alanı',
      'Çokgenler',
      'Dörtgenler ve Özellikleri',
      'Özel Dörtgenler',
      'Çemberin Temel Elemanları',
      'Çemberde Açılar',
      'Çemberde Teğet',
      'Dairenin Çevresi ve Alanı',
      'Katı Cisimler',
      'Katı Cisimlerin Yüzey Alanları ve Hacimleri',
      'Yönlü Açılar',
      'Trigonometrik Fonksiyonlar',
      'Toplam-Fark ve İki Kat Açı Formülleri',
      'Trigonometrik Denklemler',
      'Doğrunun Analitik İncelenmesi',
      'Analitik Düzlemde Temel Dönüşümler',
      'Çemberin Analitik İncelenmesi'
    ]
  },
  {
    id: 'ayt-fizik',
    examType: 'AYT',
    name: 'Fizik',
    questionCount: 14,
    expectedTopicCount: 54,
    topics: [
      'Fizik Bilimine Giriş',
      'Madde ve Özellikleri',
      'Katılar',
      'Akışkanlar',
      'Bir Boyutta Hareket',
      'Kuvvet',
      "Newton'un Hareket Yasaları",
      'İş, Enerji ve Güç',
      'Mekanik Enerji',
      'Enerjinin Korunumu ve Dönüşümleri',
      'Verim',
      'Isı, Sıcaklık ve İç Enerji',
      'Hal Değişimi',
      'Isıl Denge',
      'Enerji İletim Yolları ve Enerji İletim Hızı',
      'Genleşme',
      'Basınç ve Kaldırma Kuvveti',
      'Elektrik Yükleri',
      'Akım, Potansiyel Fark, Direnç',
      'Elektrik Devreleri',
      'Mıknatıslar',
      'Akım ve Manyetik Alan İlişkisi',
      'Dalga ve Dalga Hareketinin Temel Değişkenleri',
      'Su Dalgası',
      'Deprem Dalgaları ve Depremlerin Özellikleri',
      'Aydınlanma',
      'Gölge',
      'Yansıma',
      'Düz Aynalar',
      'Küresel Aynalar',
      'Kırılma',
      'Renk',
      'Prizmalar',
      'Mercekler',
      'Bağıl Hareket',
      'Bir Boyutta Sabit İvmeli Hareket',
      'İki Boyutta Hareket',
      'İtme ve Çizgisel Momentum',
      'Tork',
      'Denge ve Denge Şartları',
      'Basit Makineler',
      'Elektriksel Kuvvet ve Elektrik Alan',
      'Elektriksel Potansiyel',
      'Düzgün Elektrik Alan ve Sığa',
      'Manyetizma ve Elektromanyetik İndükleme',
      'Transformatörler',
      'Düzgün Çembersel Hareket',
      'Dönerek Öteleme Hareketi',
      'Açısal Momentum',
      'Kütle Çekim Kuvveti',
      'Kepler Kanunları',
      'Dalgalarda Kırınım, Girişim ve Doppler Olayı',
      'Atom Fiziğine Giriş ve Radyoaktivite',
      'Modern Fiziğin Teknolojideki Uygulamaları'
    ]
  },
  {
    id: 'ayt-kimya',
    examType: 'AYT',
    name: 'Kimya',
    questionCount: 13,
    expectedTopicCount: 16,
    topics: [
      'Kimya Bilimi',
      'Atom ve Periyodik Sistem',
      'Kimyasal Türler Arası Etkileşimler',
      'Maddenin Halleri',
      'Karışımlar',
      'Asitler, Bazlar ve Tuzlar',
      'Kimya Her Yerde',
      'Modern Atom Teorisi',
      'Gazlar',
      'Sıvı Çözeltiler ve Çözünürlük',
      'Kimyasal Tepkimelerde Enerji',
      'Kimyasal Tepkimelerde Denge',
      'Kimya ve Elektrik',
      'Karbon Kimyasına Giriş',
      'Organik Bileşikler',
      'Enerji Kaynakları ve Bilimsel Gelişmeler'
    ]
  },
  {
    id: 'ayt-biyoloji',
    examType: 'AYT',
    name: 'Biyoloji',
    questionCount: 13,
    expectedTopicCount: 30,
    topics: [
      'Bilimsel Bilginin Doğası ve Biyoloji',
      'Canlıların Ortak Özellikleri',
      'Canlıların Yapısında Bulunan Ortak Bileşikler',
      'Canlılığın Temel Birimi Hücre',
      'Canlıların Çeşitliliği ve Sınıflandırılması',
      'Canlı Alemleri ve Özellikleri',
      'Güncel Çevre Sorunları ve İnsan',
      'Doğal Kaynaklar ve Biyolojik Çeşitliliğin Korunması',
      'Mitoz ve Eşeysiz Üreme',
      'Mayoz ve Eşeyli Üreme',
      'Büyüme ve Gelişme',
      'Kalıtım ve Biyolojik Çeşitlilik',
      'Ekosistem Ekolojisi',
      'Denetleyici ve Düzenleyici Sistem, Duyu Organları',
      'Destek ve Hareket Sistemi',
      'Sindirim Sistemi',
      'Dolaşım Sistemleri',
      'Solunum Sistemi',
      'Üriner Sistem',
      'Üreme Sistemi ve Embriyonik Gelişim',
      'Komünite Ekolojisi',
      'Popülasyon Ekolojisi',
      'Nükleik Asitlerin Keşfi ve Önemi',
      'Genetik Şifre ve Protein Sentezi',
      'Canlılık ve Enerji',
      'Fotosentez',
      'Kemosentez',
      'Hücresel Solunum',
      'Bitki Biyolojisi',
      'Canlılar ve Çevre'
    ]
  },
  {
    id: 'ayt-tarih-1',
    examType: 'AYT',
    name: 'Tarih-1',
    questionCount: 10,
    expectedTopicCount: 25,
    topics: [
      'Tarih Bilimi',
      'Uygarlığın Doğuşu ve İlk Uygarlıklar',
      'İlk Türk Devletleri',
      'İslam Tarihi ve Uygarlığı (13. Yüzyıla Kadar)',
      'Türk-İslam Devletleri (10-13. Yüzyıllar)',
      'Türkiye Tarihi (11-13. Yüzyıllar)',
      'Beylikten Devlete',
      'Dünya Gücü: Osmanlı Devleti (1453-1600)',
      'Arayış Yılları (17. Yüzyıl)',
      'Avrupa ve Osmanlı Devleti (18. Yüzyıl)',
      'En Uzun Yüzyıl (1800-1922)',
      'Değişen Dünya Dengeleri Karşısında Osmanlı Siyaseti (1595-1774)',
      'Değişim Çağında Avrupa ve Osmanlı',
      'Uluslararası İlişkilerde Denge Stratejisi (1774-1914)',
      'Devrimler Çağında Değişen Devlet-Toplum İlişkileri',
      'Sermaye ve Emek',
      '19. ve 20. Yüzyılda Değişen Gündelik Hayat',
      '20. Yüzyıl Başlarında Osmanlı Devleti ve Dünya',
      'Milli Mücadele',
      'Atatürkçülük ve Türk İnkılabı',
      'İki Savaş Arasındaki Dönemde Türkiye ve Dünya',
      'II. Dünya Savaşı Sürecinde Türkiye ve Dünya',
      'II. Dünya Savaşı Sonrasında Türkiye ve Dünya',
      'Toplumsal Devrim Çağında Dünya ve Türkiye',
      'Yüzyılın Eşiğinde Türkiye ve Dünya'
    ]
  },
  {
    id: 'ayt-cografya-1',
    examType: 'AYT',
    name: 'Coğrafya-1',
    questionCount: 6,
    expectedTopicCount: 21,
    topics: [
      'Doğa ve İnsan',
      "Dünya'nın Şekli ve Hareketleri",
      'Coğrafi Konum',
      'Harita Bilgisi',
      'İklim Bilgisi',
      'Yerin Şekillenmesi',
      'Doğanın Varlıkları',
      'Beşeri Yapı',
      'Nüfusun Gelişimi, Dağılışı ve Niteliği',
      'Göçlerin Nedenleri ve Sonuçları',
      'Geçim Tarzları',
      "Türkiye'nin Yeryüzü Şekilleri ve Özellikleri",
      'Türkiye İklimi ve Özellikleri',
      "Türkiye'nin Doğal Varlıkları",
      "Türkiye'de Yerleşme, Nüfus ve Göç",
      'Bölge Türleri ve Sınırları',
      'Konum ve Etkileşim',
      'Coğrafi Keşifler',
      'Doğa ile İnsan Arasındaki Etkileşim',
      'Doğal Afetler',
      'Ekonomik Faaliyetler'
    ]
  },
  {
    id: 'ayt-tarih-2',
    examType: 'AYT',
    name: 'Tarih-2',
    questionCount: 11,
    expectedTopicCount: 25,
    topics: [
      'Tarih Bilimi',
      'Uygarlığın Doğuşu ve İlk Uygarlıklar',
      'İlk Türk Devletleri',
      'İslam Tarihi ve Uygarlığı (13. Yüzyıla Kadar)',
      'Türk-İslam Devletleri (10-13. Yüzyıllar)',
      'Türkiye Tarihi (11-13. Yüzyıllar)',
      'Beylikten Devlete',
      'Dünya Gücü: Osmanlı Devleti (1453-1600)',
      'Arayış Yılları (17. Yüzyıl)',
      'Avrupa ve Osmanlı Devleti (18. Yüzyıl)',
      'En Uzun Yüzyıl (1800-1922)',
      'Değişen Dünya Dengeleri Karşısında Osmanlı Siyaseti (1595-1774)',
      'Değişim Çağında Avrupa ve Osmanlı',
      'Uluslararası İlişkilerde Denge Stratejisi (1774-1914)',
      'Devrimler Çağında Değişen Devlet-Toplum İlişkileri',
      'Sermaye ve Emek',
      '19. ve 20. Yüzyılda Değişen Gündelik Hayat',
      '20. Yüzyıl Başlarında Osmanlı Devleti ve Dünya',
      'Milli Mücadele',
      'Atatürkçülük ve Türk İnkılabı',
      'İki Savaş Arasındaki Dönemde Türkiye ve Dünya',
      'II. Dünya Savaşı Sürecinde Türkiye ve Dünya',
      'II. Dünya Savaşı Sonrasında Türkiye ve Dünya',
      'Toplumsal Devrim Çağında Dünya ve Türkiye',
      'Yüzyılın Eşiğinde Türkiye ve Dünya'
    ]
  },
  {
    id: 'ayt-cografya-2',
    examType: 'AYT',
    name: 'Coğrafya-2',
    questionCount: 11,
    expectedTopicCount: 21,
    topics: [
      'Doğa ve İnsan',
      "Dünya'nın Şekli ve Hareketleri",
      'Coğrafi Konum',
      'Harita Bilgisi',
      'İklim Bilgisi',
      'Yerin Şekillenmesi',
      'Doğanın Varlıkları',
      'Beşeri Yapı',
      'Nüfusun Gelişimi, Dağılışı ve Niteliği',
      'Göçlerin Nedenleri ve Sonuçları',
      'Geçim Tarzları',
      "Türkiye'nin Yeryüzü Şekilleri ve Özellikleri",
      'Türkiye İklimi ve Özellikleri',
      "Türkiye'nin Doğal Varlıkları",
      "Türkiye'de Yerleşme, Nüfus ve Göç",
      'Bölge Türleri ve Sınırları',
      'Konum ve Etkileşim',
      'Coğrafi Keşifler',
      'Doğa ile İnsan Arasındaki Etkileşim',
      'Doğal Afetler',
      'Ekonomik Faaliyetler'
    ]
  },
  {
    id: 'ayt-felsefe',
    examType: 'AYT',
    name: 'Felsefe',
    questionCount: 12,
    expectedTopicCount: 22,
    topics: [
      'Felsefenin Alanı',
      'Bilgi Felsefesi',
      'Bilim Felsefesi',
      'Varlık Felsefesi',
      'Ahlak Felsefesi',
      'Siyaset Felsefesi',
      'Sanat Felsefesi',
      'Din Felsefesi',
      'Mantığa Giriş',
      'Klasik Mantık',
      'Mantık ve Dil',
      'Sembolik Mantık',
      'Psikoloji Bilimini Tanıyalım',
      'Psikolojinin Temel Süreçleri',
      'Öğrenme Bellek Düşünme',
      'Ruh Sağlığının Temelleri',
      'Sosyolojiye Giriş',
      'Birey ve Toplum',
      'Toplumsal Yapı',
      'Toplumsal Değişme ve Gelişme',
      'Toplum ve Kültür',
      'Toplumsal Kurumlar'
    ]
  },
  {
    id: 'ayt-din-kulturu',
    examType: 'AYT',
    name: 'Din Kültürü',
    questionCount: 6,
    expectedTopicCount: 15,
    topics: [
      'İnanç',
      'İbadet',
      'Ahlak ve Değerler',
      'Din, Kültür ve Medeniyet',
      'Hz. Muhammed (SAV)',
      'Vahiy ve Akıl',
      'Dünya ve Ahiret',
      "Kur'an'a Göre Hz. Muhammed",
      'İnançla İlgili Meseleler',
      'Yahudilik ve Hristiyanlık',
      'İslam ve Bilim',
      "Anadolu'da İslam",
      'İslam Düşüncesinde Tasavvufi Yorumlar',
      'Güncel Dinî Meseleler',
      'Hint ve Çin Dinleri'
    ]
  },

  // =========================================================
  // YDT — Yabancı Dil Testi (1 ders · 11 konu)
  // =========================================================
  {
    id: 'ydt-yabanci-dil',
    examType: 'YDT',
    name: 'Yabancı Dil',
    questionCount: 80,
    expectedTopicCount: 11,
    topics: [
      'Kelime Bilgisi',
      'Dilbilgisi',
      'Cloze Test',
      'Cümleyi Tamamlama',
      'İNG/TR Cümlenin Karşılığını Bulma',
      'Paragraf',
      'Anlamca Yakın Cümleyi Bulma',
      'Paragrafta Anlam Bütünlüğünü Sağlayacak Cümleyi Bulma',
      'Verilen Durumda Söylenecek İfadeyi Bulma',
      'Diyalog Tamamlama',
      'Anlam Bütünlüğünü Bozan Cümleyi Bulma'
    ]
  }
];

export const CURRICULUM_SUBJECTS: CurriculumSubject[] = RAW_SUBJECTS.map((subject) => ({
  id: subject.id,
  examType: subject.examType,
  name: subject.name,
  questionCount: subject.questionCount,
  topicCount: subject.topics.length,
  topics: subject.topics.map((title, index) => ({
    id: `${subject.id}-${index + 1}`,
    order: index + 1,
    title,
    subjectId: subject.id,
    subjectName: subject.name,
    examType: subject.examType
  }))
}));

export const EXAM_CATEGORIES: readonly {
  id: ExamCategory;
  label: string;
  fullName: string;
}[] = [
  { id: 'TYT', label: 'TYT', fullName: 'Temel Yeterlilik Testi' },
  { id: 'AYT', label: 'AYT', fullName: 'Alan Yeterlilik Testi' },
  { id: 'YDT', label: 'YDT', fullName: 'Yabancı Dil Testi' }
];

export const ALL_CURRICULUM_TOPICS: CurriculumTopic[] = CURRICULUM_SUBJECTS.flatMap(
  (subject) => subject.topics
);

export const SUBJECTS_BY_EXAM: Record<ExamCategory, CurriculumSubject[]> = {
  TYT: CURRICULUM_SUBJECTS.filter((s) => s.examType === 'TYT'),
  AYT: CURRICULUM_SUBJECTS.filter((s) => s.examType === 'AYT'),
  YDT: CURRICULUM_SUBJECTS.filter((s) => s.examType === 'YDT')
};

export const CURRICULUM_TOTALS = {
  subjectCount: CURRICULUM_SUBJECTS.length,
  topicCount: ALL_CURRICULUM_TOPICS.length,
  byExam: {
    TYT: {
      subjectCount: SUBJECTS_BY_EXAM.TYT.length,
      topicCount: SUBJECTS_BY_EXAM.TYT.reduce((sum, s) => sum + s.topicCount, 0)
    },
    AYT: {
      subjectCount: SUBJECTS_BY_EXAM.AYT.length,
      topicCount: SUBJECTS_BY_EXAM.AYT.reduce((sum, s) => sum + s.topicCount, 0)
    },
    YDT: {
      subjectCount: SUBJECTS_BY_EXAM.YDT.length,
      topicCount: SUBJECTS_BY_EXAM.YDT.reduce((sum, s) => sum + s.topicCount, 0)
    }
  }
} as const;
