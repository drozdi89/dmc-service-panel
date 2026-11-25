/**
 * Help body for the code generator template editor.
 *
 * Content mirrors Desktop `_HELP_HTML` from
 * `modules/CodeGenerators/template_editor.py` (CounterSpec editor).
 */
export function CodeGeneratorTemplateHelpContent() {
  return (
    <div>
      <p>
        <b>1. Создать шаблон</b> — укажите уникальное имя и строку шаблона с
        плейсхолдерами в фигурных скобках. Откройте «Справочник переменных» и
        вставьте имя двойным щелчком.
      </p>
      <p>
        <b>2. Настроить счётчики</b> — для каждого <code>{'{serial}'}</code>{' '}
        добавьте карточку: имя, число цифр (width), диапазон От–До, отметьте
        поля, при смене которых начинается новый ряд серии (key_fields).
      </p>
      <p>
        <b>3. Проверить</b> — укажите ID задания и уровень агрегации, нажмите
        «Проверить» (запрос preview, счётчики в БД не меняются).
      </p>
      <p>
        <b>4. Сохранить</b> — шаблон появится в списке генераторов на линии.
      </p>
      <p>
        Пример:{' '}
        <code>
          {'01{gtin:>014}21{serial:06d}{gs}11{mandate_11}93{random8}'}
        </code>
      </p>
      <p>
        Не используйте <code>{'{barcode}'}</code>, <code>{'{sscc}'}</code> и
        другие поля, зависящие от готового кода.
      </p>
    </div>
  );
}