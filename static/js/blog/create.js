const COLORS = [
  '#000000',
  '#e60000',
  '#008a00',
  '#0066cc',
  '#ffff00',
//   'custom' // ← 自由色トリガー
];

const toolbarOptions = [
  ['bold', 'italic', 'underline'],
  [{ color: [...COLORS] }, { background: [...COLORS] }],
  ['customColor', 'customBg'], // ← 独自ボタン
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image'],
  ['clean']
];

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: {
      container: toolbarOptions,
      handlers: {
       
        customColor() {
          openColorPicker('color');
        },
        customBg() {
          openColorPicker('background');
        }
      }
    }
  }
});

let colorPicker = null;
let currentFormat = 'color';
let savedRange = null;

function getColorPicker() {
  if (colorPicker) return colorPicker;

  colorPicker = document.createElement('input');
  colorPicker.type = 'color';

  // 見えないが確実に動く配置
  colorPicker.style.position = 'fixed';
  colorPicker.style.top = '0';
  colorPicker.style.left = '0';
  colorPicker.style.width = '1px';
  colorPicker.style.height = '1px';
  colorPicker.style.border = 'none';
  colorPicker.style.padding = '0';
  colorPicker.style.background = 'transparent';

  document.body.appendChild(colorPicker);

  colorPicker.addEventListener('input', () => {
    if (savedRange) {
      quill.setSelection(savedRange);
    }
    quill.format(currentFormat, colorPicker.value);
    colorPicker.blur();
  });

  return colorPicker;
}

function openColorPicker(format) {
  currentFormat = format;

  const picker = getColorPicker();

  // 毎回 input を発火させる
  picker.value = '#000000';

  savedRange = quill.getSelection();

  requestAnimationFrame(() => {
    picker.click();
  });
}
