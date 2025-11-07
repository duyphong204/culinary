import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

i18next
  .use(Backend)
  .init({
    lng: 'vi',
    fallbackLng: 'en',
    backend: {
      loadPath: join(__dirname, 'locales/{{lng}}.json'),
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;