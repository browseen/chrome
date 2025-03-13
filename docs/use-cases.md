# Browseen: Scenariusze użycia

## 1. Dla osób z niepełnosprawnościami

### Osoby z niepełnosprawnością wzroku
**Scenariusz:** Marek jest niewidomy i korzysta z czytnika ekranu. Mimo że wiele stron ma problemy z dostępnością, Browseen pozwala mu wydawać te same komendy głosowe niezależnie od strony.

**Przykład użycia:**
1. Marek mówi: "Przejdź do portalu informacyjnego"
2. Browseen tłumaczy to na: `GO TO 'onet.pl'`
3. Marek mówi: "Znajdź najnowsze wiadomości"
4. Browseen tłumaczy to na: `FIND 'Najnowsze'` i podświetla odpowiednią sekcję
5. Marek mówi: "Czytaj pierwszy artykuł" 
6. Browseen tłumaczy to na: `CLICK first article` i uruchamia czytnik

### Osoby z ograniczoną sprawnością ruchową
**Scenariusz:** Ania ma porażenie mózgowe, co utrudnia jej precyzyjne klikanie. Może wydawać proste komendy, które Browseen realizuje bez konieczności trafiania w małe elementy interfejsu.

## 2. Dla profesjonalistów i firm

### Automatyzacja marketingu
**Scenariusz:** Firma marketingowa musi publikować ten sam komunikat na wielu platformach społecznościowych, co zwykle wymaga ręcznego logowania się na każdą z nich.

**Przykład użycia:**
```
SEQUENCE "publikuj-na-platformach":
  GO TO 'facebook.com'
  CLICK 'Zaloguj się'
  TYPE '{CREDENTIALS.FB_LOGIN}' IN 'Email or Phone'
  TYPE '{CREDENTIALS.FB_PASSWORD}' IN 'Password'
  CLICK 'Log In'
  CLICK 'Create Post'
  TYPE '{CONTENT.MESSAGE}' IN 'post'
  CLICK 'Post'
  
  GO TO 'twitter.com'
  CLICK 'Log in'
  TYPE '{CREDENTIALS.TW_LOGIN}' IN 'username'
  TYPE '{CREDENTIALS.TW_PASSWORD}' IN 'password'
  CLICK 'Log in'
  CLICK 'Tweet'
  TYPE '{CONTENT.MESSAGE}' IN 'tweet'
  CLICK 'Tweet'
  
  # dodatkowe platformy...
END SEQUENCE
```

### Analityka konkurencji
**Scenariusz:** Zespół analityczny monitoruje ceny i promocje konkurencji, co wymaga regularnego odwiedzania dziesiątek stron internetowych.

**Przykład użycia:**
```
SEQUENCE "monitoruj-ceny":
  FOREACH website IN competitor_list:
    GO TO website
    FIND 'Bestsellery'
    FOR products FROM 1 TO 5:
      FIND 'product-{products}'
      EXTRACT price AS 'competitor_price_{website}_{products}'
      EXTRACT name AS 'competitor_product_{website}_{products}'
    END FOR
  END FOREACH
  EXPORT RESULTS TO 'price_monitoring.csv'
END SEQUENCE
```

## 3. Dla użytkowników codziennych

### Rodzic zarządzający czasem ekranowym
**Scenariusz:** Joanna chce kontrolować, jak długo jej dzieci korzystają z YouTube i jakie treści oglądają.

**Przykład użycia:**
1. Joanna ustawia komendę: `WHEN time > "19:00" THEN BLOCK 'youtube.com'`
2. Dodaje filtr zawartości: `WHEN video CONTAINS "18+" OR "przemoc" THEN BLOCK video`
3. Otrzymuje raport: `AT "20:00" GENERATE REPORT OF "watched videos"`

### Student oszczędzający czas
**Scenariusz:** Michał studiuje inżynierię i potrzebuje szybko znaleźć i zapisać artykuły naukowe do swojej pracy dyplomowej.

**Przykład użycia:**
```
SEQUENCE "zbierz-artykuły":
  GO TO 'scholar.google.com'
  TYPE 'machine learning optimization algorithms' IN 'Search'
  CLICK 'Search'
  FOR results FROM 1 TO 10:
    CLICK result
    CLICK 'PDF'
    SAVE TO 'Praca dyplomowa/Artykuły'
    GO BACK
  END FOR
END SEQUENCE
```

## 4. Dla deweloperów i testerów

### Testowanie aplikacji webowych
**Scenariusz:** Zespół QA musi regularnie testować aplikację webową na różnych przeglądarkach i urządzeniach.

**Przykład użycia:**
```
TEST CASE "rejestracja-użytkownika":
  GO TO '{TEST_URL}/register'
  TYPE '{TEST_DATA.email}' IN 'Email'
  TYPE '{TEST_DATA.password}' IN 'Password'
  TYPE '{TEST_DATA.password}' IN 'Confirm Password'
  TOGGLE 'Accept Terms'
  CLICK 'Register'
  ASSERT TEXT 'Thank you for registering' IS VISIBLE
  ASSERT URL CONTAINS '/dashboard'
END TEST CASE
```

### Deweloper integrujący systemy
**Scenariusz:** Programista musi zintegrować dwa systemy, z których jeden nie posiada API.

**Przykład użycia:**
```
SCHEDULE "transfer-danych" EVERY DAY AT "01:00":
  GO TO 'system-legacy.com/admin'
  LOGIN WITH credentials.legacy
  CLICK 'Export'
  CLICK 'Generate report'
  WAIT FOR download TO complete
  GO TO 'system-new.com/admin'
  LOGIN WITH credentials.new
  CLICK 'Import'
  UPLOAD downloaded_file
  CLICK 'Process'
  WAIT FOR processing TO complete
  SEND NOTIFICATION "Transfer completed with {result.status}"
END SCHEDULE
```

## 5. Dla seniorów

### Komunikacja z rodziną
**Scenariusz:** Edward (78 lat) chce regularnie kontaktować się z wnukami, ale ma problemy z zapamiętaniem kroków na różnych platformach komunikacyjnych.

**Przykład użycia:**
1. Edward klika na skrót "Rozmowa z Zosią" na pulpicie
2. Browseen automatycznie wykonuje:
   ```
   GO TO 'messenger.com'
   CLICK conversation WITH 'Zosia'
   ENABLE camera
   ENABLE microphone
   CLICK 'Video call'
   ```

### Zakupy online
**Scenariusz:** Krystyna (72 lata) chce robić zakupy online, ale boi się skomplikowanych formularzy i płatności.

**Przykład użycia:**
1. Krystyna mówi: "Chcę kupić mleko, chleb i masło"
2. Browseen:
   ```
   GO TO 'e-sklep.pl'
   SEARCH FOR 'mleko'
   CLICK 'Dodaj do koszyka' ON first result
   SEARCH FOR 'chleb'
   CLICK 'Dodaj do koszyka' ON first result
   SEARCH FOR 'masło'
   CLICK 'Dodaj do koszyka' ON first result
   CLICK 'Przejdź do kasy'
   AUTOFILL address WITH 'saved_address_home'
   SELECT 'Płatność przy odbiorze'
   CONFIRM order
   ```

## 6. Dla branży edukacyjnej

### Nauczyciel przygotowujący materiały
**Scenariusz:** Nauczycielka historii musi przygotować materiały dla uczniów, znajdując odpowiednie zdjęcia i teksty.

**Przykład użycia:**
```
SEQUENCE "zbierz-materiały-o-II-wojnie":
  GO TO 'wikipedia.org'
  SEARCH FOR 'II wojna światowa'
  EXTRACT paragraphs 1-3 AS 'wprowadzenie'
  EXTRACT images AS 'zdjęcia-historyczne'
  
  GO TO 'wolnelektury.pl'
  SEARCH FOR 'wojna poezja'
  EXTRACT first 5 results AS 'literatura'
  
  GO TO 'youtube.com'
  SEARCH FOR 'dokumenty o II wojnie światowej'
  EXTRACT first 3 results AS 'materiały-wideo'
  
  CREATE presentation WITH:
    TITLE: "II Wojna Światowa - materiały edukacyjne"
    SECTIONS: ['wprowadzenie', 'zdjęcia-historyczne', 'literatura', 'materiały-wideo']
  SAVE TO 'Lekcje/Historia/II-wojna'
END SEQUENCE
```

### Student z dysleksją
**Scenariusz:** Uczeń z dysleksją potrzebuje specjalnych narzędzi do czytania materiałów online.

**Przykład użycia:**
1. Aktywacja poleceniem: `ENABLE 'tryb dysleksja'`
2. Rezultat: Browseen automatycznie dostosowuje każdą stronę:
   - Zmienia czcionkę na bardziej czytelną
   - Zwiększa odstępy między liniami
   - Dodaje opcję czytania na głos
   - Podświetla aktualnie czytany fragment

## 7. Dla branży e-commerce

### Sprzedawca monitorujący konkurencję
**Scenariusz:** Właściciel sklepu internetowego musi regularnie sprawdzać ceny u konkurencji.

**Przykład użycia:**
```
SCHEDULE "monitorowanie-cen" DAILY AT "6:00":
  FOR EACH product IN 'my_products.csv':
    FOR EACH competitor IN 'competitors.csv':
      GO TO '{competitor.url}'
      SEARCH FOR '{product.name}'
      EXTRACT price FROM first result AS '{product.id}_{competitor.id}'
    END FOR
  END FOR
  ANALYZE price_differences
  IF any_price_difference > 10%:
    SEND ALERT TO 'manager@company.com'
  END IF
END SCHEDULE
```

### Klient szukający najlepszych ofert
**Scenariusz:** Klient planuje zakup nowego sprzętu AGD i chce porównać oferty z wielu sklepów.

**Przykład użycia:**
```
SEQUENCE "porównaj-ceny-lodówki":
  DEFINE parameters:
    model: "Samsung RB38T"
    max_price: 2500
  
  FOR EACH shop IN 'elektroniczne_sklepy.csv':
    GO TO shop.url
    SEARCH FOR model
    IF results > 0:
      EXTRACT first_result AS temp_data
      SAVE TO comparison:
        shop: shop.name
        price: temp_data.price
        availability: temp_data.availability
        delivery_time: temp_data.delivery
    END IF
  END FOR
  
  SORT comparison BY price ASC
  SHOW TOP 5 results
  HIGHLIGHT best_value_offer
END SEQUENCE
```

## 8. Dla mediów społecznościowych

### Influencer zarządzający wieloma platformami
**Scenariusz:** Twórca treści musi publikować i monitorować treści na wielu platformach.

**Przykład użycia:**
```
SCHEDULE "publikacja-treści" AT [time]:
  FOR EACH platform IN ['instagram', 'tiktok', 'youtube', 'facebook']:
    GO TO '{platform}.com'
    LOGIN WITH credentials[platform]
    UPLOAD content[platform]
    ADD caption[platform]
    ADD hashtags[platform]
    PUBLISH
    WAIT 30 minutes
    EXTRACT engagement_stats AS '{platform}_stats'
  END FOR
  
  GENERATE engagement_report
  IF any_platform_below_threshold:
    SUGGEST content_optimization
  END IF
END SCHEDULE
```

### Użytkownik zarządzający prywatnością
**Scenariusz:** Osoba dbająca o prywatność chce mieć pełną kontrolę nad tym, co udostępnia.

**Przykład użycia:**
```
SEQUENCE "audit-prywatności":
  FOR EACH platform IN social_platforms:
    GO TO '{platform}/settings'
    GO TO 'privacy'
    EXTRACT current_settings AS '{platform}_privacy'
    FOR EACH setting IN privacy_checklist:
      FIND setting.name
      IF setting.current != setting.recommended:
        HIGHLIGHT setting
        SUGGEST change
        IF auto_fix:
          CHANGE setting TO setting.recommended
        END IF
      END IF
    END FOR
  END FOR
  
  GENERATE privacy_score
  SHOW privacy_improvement_tips
END SEQUENCE
```

## 9. Dla branży finansowej

### Księgowy pobierający faktury
**Scenariusz:** Księgowy musi regularnie pobierać faktury z wielu systemów.

**Przykład użycia:**
```
SCHEDULE "pobierz-faktury" ON 15 DAY OF EACH MONTH:
  FOR EACH supplier IN suppliers_list:
    GO TO supplier.invoice_portal
    LOGIN WITH supplier.credentials
    CLICK 'Faktury'
    SET date_range FROM '1st of previous month' TO 'last day of previous month'
    CLICK 'Wyszukaj'
    DOWNLOAD ALL documents
    RENAME EACH document TO '{supplier.name}_{document.date}_{document.number}.pdf'
    MOVE ALL TO 'Księgowość/Faktury/{current_month}'
  END FOR
  
  NOTIFY accounting_team
END SCHEDULE
```

### Klient banku sprawdzający oferty
**Scenariusz:** Klient chce porównać oferty kredytowe z różnych banków.

**Przykład użycia:**
```
SEQUENCE "porównaj-kredyty":
  DEFINE parameters:
    amount: 300000
    period: 30
    purpose: "mieszkaniowy"
  
  FOR EACH bank IN banks_list:
    GO TO bank.url
    FIND 'kalkulator kredytowy'
    INPUT amount IN 'kwota kredytu'
    INPUT period IN 'okres kredytowania'
    SELECT purpose IN 'cel kredytu'
    CLICK 'Oblicz'
    EXTRACT results AS bank.offer
  END FOR
  
  CREATE comparison_table WITH:
    COLUMNS: ['Bank', 'Rata', 'Oprocentowanie', 'Prowizja', 'RRSO', 'Całkowity koszt']
    DATA: extracted_offers
  
  SORT BY 'Całkowity koszt' ASC
  HIGHLIGHT best_offer
END SEQUENCE
```

## 10. Dla administracji państwowej

### Urzędnik przetwarzający wnioski
**Scenariusz:** Pracownik administracji musi przetwarzać wnioski obywateli z różnych systemów.

**Przykład użycia:**
```
SEQUENCE "przetwórz-wnioski":
  LOGIN TO government_portal WITH admin_credentials
  GO TO 'Nowe wnioski'
  FOR EACH application IN visible_applications:
    CLICK application
    EXTRACT applicant_data
    VERIFY against 'central_registry'
    IF verification_successful:
      CLICK 'Zatwierdź'
    ELSE:
      ADD COMMENT 'Weryfikacja negatywna: {verification_reason}'
      CLICK 'Odrzuć'
    END IF
    LOG action TO 'applications_log.xlsx'
  END FOR
  
  GENERATE daily_report
  SEND TO supervisor@gov.org
END SEQUENCE
```

### Obywatel załatwiający sprawę urzędową
**Scenariusz:** Osoba musi złożyć wniosek o nowy dowód osobisty online.

**Przykład użycia:**
1. Obywatel klika na skrót "Nowy dowód osobisty"
2. Browseen automatycznie:
   ```
   GO TO 'gov.pl'
   FIND 'Dowód osobisty'
   CLICK 'Złóż wniosek online'
   LOGIN WITH trusted_profile
   AUTOFILL form WITH saved_personal_data
   UPLOAD 'zdjęcie.jpg' TO 'Fotografia'
   CONFIRM data_correctness
   SUBMIT application
   SAVE confirmation AS 'potwierdzenie_dowód.pdf'
   ADD TO calendar 'Odbiór dowodu' IN 30 days
   ```
