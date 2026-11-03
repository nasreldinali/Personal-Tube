const legacyMessages = {
  invalidChannel: 'أدخل رابط قناة صالحاً أو @handle أو معرّف القناة.',
  network: 'تعذّر الاتصال بيوتيوب. تحقق من الإنترنت ثم أعد المحاولة.',
  quota: 'انتهت حصة API اليومية. حاول بعد تجدد الحصة.',
};

export class AppError extends Error {
  constructor(code) {
    super(legacyMessages[code] || code);
    this.name = 'AppError';
    this.code = code;
  }
}
