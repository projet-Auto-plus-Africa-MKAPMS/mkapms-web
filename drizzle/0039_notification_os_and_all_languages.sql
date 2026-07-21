-- Notification OS + All World Languages (règle MOS #15, additive pure).
-- Aucune modification de la table `notifications` existante — le moteur
-- ajoute ses tables sœurs avec préfixe `notif_*`.

-- ═══════════════════════════════════════════════════════════════════════
-- NOTIFICATION OS — Templates, préférences, journal d'envoi
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "notif_templates" (
  "id" serial PRIMARY KEY,
  "key" varchar(96) NOT NULL,               -- ex: "annonce.published"
  "channel" varchar(16) NOT NULL,           -- email | sms | push | inapp
  "language" varchar(8) NOT NULL,
  "subject" varchar(255),                    -- email uniquement
  "body" text NOT NULL,
  "variables" jsonb NOT NULL DEFAULT '[]'::jsonb,  -- ["name","link",...]
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "notif_templates_unique" UNIQUE ("key","channel","language")
);
CREATE INDEX IF NOT EXISTS "notif_templates_key_idx" ON "notif_templates" ("key");

CREATE TABLE IF NOT EXISTS "notif_user_preferences" (
  "user_id" integer PRIMARY KEY,
  "email_enabled" boolean NOT NULL DEFAULT true,
  "sms_enabled" boolean NOT NULL DEFAULT false,
  "push_enabled" boolean NOT NULL DEFAULT true,
  "inapp_enabled" boolean NOT NULL DEFAULT true,
  "digest_enabled" boolean NOT NULL DEFAULT false,
  "digest_frequency" varchar(16) NOT NULL DEFAULT 'daily',  -- realtime | daily | weekly
  "quiet_hours_from" integer,   -- 0..23 UTC
  "quiet_hours_to" integer,
  "muted_categories" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notif_dispatch_log" (
  "id" bigserial PRIMARY KEY,
  "user_id" integer,
  "template_key" varchar(96),
  "channel" varchar(16) NOT NULL,
  "language" varchar(8),
  "status" varchar(16) NOT NULL,           -- queued | sent | failed | skipped
  "error" text,
  "payload" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "sent_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "notif_dispatch_created_idx" ON "notif_dispatch_log" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "notif_dispatch_user_idx" ON "notif_dispatch_log" ("user_id");

CREATE TABLE IF NOT EXISTS "notif_health_log" (
  "id" bigserial PRIMARY KEY,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- LANGUAGE OS — Toutes les langues du monde (ISO 639-1, ~180 codes)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO "language_languages" ("code","code3","name_native","name_fr","name_en","rtl") VALUES
  -- Europe
  ('fr','fra','Français','Français','French',false),
  ('en','eng','English','Anglais','English',false),
  ('es','spa','Español','Espagnol','Spanish',false),
  ('de','deu','Deutsch','Allemand','German',false),
  ('it','ita','Italiano','Italien','Italian',false),
  ('pt','por','Português','Portugais','Portuguese',false),
  ('nl','nld','Nederlands','Néerlandais','Dutch',false),
  ('pl','pol','Polski','Polonais','Polish',false),
  ('ru','rus','Русский','Russe','Russian',false),
  ('uk','ukr','Українська','Ukrainien','Ukrainian',false),
  ('cs','ces','Čeština','Tchèque','Czech',false),
  ('sk','slk','Slovenčina','Slovaque','Slovak',false),
  ('hu','hun','Magyar','Hongrois','Hungarian',false),
  ('ro','ron','Română','Roumain','Romanian',false),
  ('bg','bul','Български','Bulgare','Bulgarian',false),
  ('el','ell','Ελληνικά','Grec','Greek',false),
  ('sv','swe','Svenska','Suédois','Swedish',false),
  ('no','nor','Norsk','Norvégien','Norwegian',false),
  ('da','dan','Dansk','Danois','Danish',false),
  ('fi','fin','Suomi','Finnois','Finnish',false),
  ('is','isl','Íslenska','Islandais','Icelandic',false),
  ('et','est','Eesti','Estonien','Estonian',false),
  ('lv','lav','Latviešu','Letton','Latvian',false),
  ('lt','lit','Lietuvių','Lituanien','Lithuanian',false),
  ('hr','hrv','Hrvatski','Croate','Croatian',false),
  ('sr','srp','Српски','Serbe','Serbian',false),
  ('sl','slv','Slovenščina','Slovène','Slovenian',false),
  ('mk','mkd','Македонски','Macédonien','Macedonian',false),
  ('bs','bos','Bosanski','Bosniaque','Bosnian',false),
  ('sq','sqi','Shqip','Albanais','Albanian',false),
  ('mt','mlt','Malti','Maltais','Maltese',false),
  ('ga','gle','Gaeilge','Irlandais','Irish',false),
  ('cy','cym','Cymraeg','Gallois','Welsh',false),
  ('eu','eus','Euskara','Basque','Basque',false),
  ('ca','cat','Català','Catalan','Catalan',false),
  ('gl','glg','Galego','Galicien','Galician',false),
  ('be','bel','Беларуская','Biélorusse','Belarusian',false),
  ('lb','ltz','Lëtzebuergesch','Luxembourgeois','Luxembourgish',false),
  ('fo','fao','Føroyskt','Féroïen','Faroese',false),
  -- Asie
  ('zh','zho','中文','Chinois','Chinese',false),
  ('ja','jpn','日本語','Japonais','Japanese',false),
  ('ko','kor','한국어','Coréen','Korean',false),
  ('vi','vie','Tiếng Việt','Vietnamien','Vietnamese',false),
  ('th','tha','ไทย','Thaï','Thai',false),
  ('id','ind','Bahasa Indonesia','Indonésien','Indonesian',false),
  ('ms','msa','Bahasa Melayu','Malais','Malay',false),
  ('tl','tgl','Tagalog','Tagalog','Tagalog',false),
  ('hi','hin','हिन्दी','Hindi','Hindi',false),
  ('bn','ben','বাংলা','Bengali','Bengali',false),
  ('ur','urd','اردو','Ourdou','Urdu',true),
  ('pa','pan','ਪੰਜਾਬੀ','Pendjabi','Punjabi',false),
  ('gu','guj','ગુજરાતી','Gujarati','Gujarati',false),
  ('ta','tam','தமிழ்','Tamoul','Tamil',false),
  ('te','tel','తెలుగు','Télougou','Telugu',false),
  ('kn','kan','ಕನ್ನಡ','Kannada','Kannada',false),
  ('ml','mal','മലയാളം','Malayalam','Malayalam',false),
  ('mr','mar','मराठी','Marathi','Marathi',false),
  ('ne','nep','नेपाली','Népalais','Nepali',false),
  ('si','sin','සිංහල','Cingalais','Sinhala',false),
  ('km','khm','ខ្មែរ','Khmer','Khmer',false),
  ('lo','lao','ລາວ','Laotien','Lao',false),
  ('my','mya','မြန်မာ','Birman','Burmese',false),
  ('mn','mon','Монгол','Mongol','Mongolian',false),
  ('ka','kat','ქართული','Géorgien','Georgian',false),
  ('hy','hye','Հայերեն','Arménien','Armenian',false),
  ('az','aze','Azərbaycan','Azerbaïdjanais','Azerbaijani',false),
  ('kk','kaz','Қазақ','Kazakh','Kazakh',false),
  ('uz','uzb','O''zbek','Ouzbek','Uzbek',false),
  ('ky','kir','Кыргыз','Kirghize','Kyrgyz',false),
  ('tg','tgk','Тоҷикӣ','Tadjik','Tajik',false),
  ('tk','tuk','Türkmen','Turkmène','Turkmen',false),
  ('tr','tur','Türkçe','Turc','Turkish',false),
  -- Moyen-Orient (RTL)
  ('ar','ara','العربية','Arabe','Arabic',true),
  ('he','heb','עברית','Hébreu','Hebrew',true),
  ('fa','fas','فارسی','Persan','Persian',true),
  ('ku','kur','Kurdî','Kurde','Kurdish',false),
  ('ps','pus','پښتو','Pachto','Pashto',true),
  ('sd','snd','سنڌي','Sindhi','Sindhi',true),
  -- Afrique
  ('sw','swa','Kiswahili','Swahili','Swahili',false),
  ('am','amh','አማርኛ','Amharique','Amharic',false),
  ('ha','hau','Hausa','Haoussa','Hausa',false),
  ('yo','yor','Yorùbá','Yoruba','Yoruba',false),
  ('ig','ibo','Igbo','Igbo','Igbo',false),
  ('zu','zul','isiZulu','Zoulou','Zulu',false),
  ('xh','xho','isiXhosa','Xhosa','Xhosa',false),
  ('af','afr','Afrikaans','Afrikaans','Afrikaans',false),
  ('so','som','Soomaali','Somali','Somali',false),
  ('rw','kin','Kinyarwanda','Kinyarwanda','Kinyarwanda',false),
  ('mg','mlg','Malagasy','Malgache','Malagasy',false),
  ('sn','sna','ChiShona','Shona','Shona',false),
  ('lg','lug','Luganda','Ganda','Ganda',false),
  ('wo','wol','Wolof','Wolof','Wolof',false),
  ('ff','ful','Fulfulde','Peul','Fulah',false),
  ('bm','bam','Bamanankan','Bambara','Bambara',false),
  ('ny','nya','ChiCheŵa','Chichewa','Chichewa',false),
  ('st','sot','Sesotho','Sotho','Sotho',false),
  ('tn','tsn','Setswana','Tswana','Tswana',false),
  ('ts','tso','Xitsonga','Tsonga','Tsonga',false),
  -- Amériques (langues natives + créoles)
  ('qu','que','Runa Simi','Quechua','Quechua',false),
  ('ay','aym','Aymar','Aymara','Aymara',false),
  ('gn','grn','Avañeẽ','Guarani','Guarani',false),
  ('ht','hat','Kreyòl','Créole haïtien','Haitian Creole',false),
  -- Océanie & autres
  ('mi','mri','Māori','Maori','Maori',false),
  ('sm','smo','Gagana Sāmoa','Samoan','Samoan',false),
  ('to','ton','Faka-Tonga','Tongien','Tongan',false),
  ('haw','haw','Ōlelo Hawaiʻi','Hawaïen','Hawaiian',false),
  ('fj','fij','Vosa Vakaviti','Fidjien','Fijian',false),
  -- Autres langues significatives
  ('eo','epo','Esperanto','Espéranto','Esperanto',false),
  ('la','lat','Latina','Latin','Latin',false),
  ('yi','yid','ייִדיש','Yiddish','Yiddish',true),
  ('kl','kal','Kalaallisut','Groenlandais','Greenlandic',false),
  ('se','sme','Davvisámegiella','Sami du Nord','Northern Sami',false),
  ('br','bre','Brezhoneg','Breton','Breton',false),
  ('co','cos','Corsu','Corse','Corsican',false),
  ('oc','oci','Occitan','Occitan','Occitan',false),
  ('rm','roh','Rumantsch','Romanche','Romansh',false),
  ('sc','srd','Sardu','Sarde','Sardinian',false),
  ('gd','gla','Gàidhlig','Gaélique écossais','Scottish Gaelic',false)
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- LANGUAGE OS — Trads UI FR/EN de base (seed initial pour l'ossature)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO "language_translations" ("namespace","key","language","value","source","validated") VALUES
  ('ui','common.save','fr','Enregistrer','human',true),
  ('ui','common.save','en','Save','human',true),
  ('ui','common.cancel','fr','Annuler','human',true),
  ('ui','common.cancel','en','Cancel','human',true),
  ('ui','common.delete','fr','Supprimer','human',true),
  ('ui','common.delete','en','Delete','human',true),
  ('ui','common.edit','fr','Modifier','human',true),
  ('ui','common.edit','en','Edit','human',true),
  ('ui','common.close','fr','Fermer','human',true),
  ('ui','common.close','en','Close','human',true),
  ('ui','common.confirm','fr','Confirmer','human',true),
  ('ui','common.confirm','en','Confirm','human',true),
  ('ui','common.back','fr','Retour','human',true),
  ('ui','common.back','en','Back','human',true),
  ('ui','common.search','fr','Rechercher','human',true),
  ('ui','common.search','en','Search','human',true),
  ('ui','common.loading','fr','Chargement…','human',true),
  ('ui','common.loading','en','Loading…','human',true),
  ('ui','common.error','fr','Erreur','human',true),
  ('ui','common.error','en','Error','human',true),
  ('ui','common.success','fr','Succès','human',true),
  ('ui','common.success','en','Success','human',true),
  ('ui','nav.home','fr','Accueil','human',true),
  ('ui','nav.home','en','Home','human',true),
  ('ui','nav.marketplace','fr','Annonces','human',true),
  ('ui','nav.marketplace','en','Listings','human',true),
  ('ui','nav.sell','fr','Vendre','human',true),
  ('ui','nav.sell','en','Sell','human',true),
  ('ui','nav.rent','fr','Location','human',true),
  ('ui','nav.rent','en','Rent','human',true),
  ('ui','nav.account','fr','Mon compte','human',true),
  ('ui','nav.account','en','My account','human',true),
  ('ui','nav.messages','fr','Messages','human',true),
  ('ui','nav.messages','en','Messages','human',true),
  ('ui','auth.login','fr','Se connecter','human',true),
  ('ui','auth.login','en','Log in','human',true),
  ('ui','auth.logout','fr','Se déconnecter','human',true),
  ('ui','auth.logout','en','Log out','human',true),
  ('ui','auth.register','fr','Créer un compte','human',true),
  ('ui','auth.register','en','Sign up','human',true),
  ('ui','auth.email','fr','Adresse email','human',true),
  ('ui','auth.email','en','Email address','human',true),
  ('ui','auth.password','fr','Mot de passe','human',true),
  ('ui','auth.password','en','Password','human',true),
  ('ui','auth.forgot','fr','Mot de passe oublié ?','human',true),
  ('ui','auth.forgot','en','Forgot password?','human',true)
ON CONFLICT ("namespace","key","language") DO NOTHING;
