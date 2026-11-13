export function speakEnglish(text: string, rate = 0.95): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith("en-US") && v.localService) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) {
      utterance.voice = preferred;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis errors on restricted browsers
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startEnglishListening(
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError: (msg: string) => void
): (() => void) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, new () => SpeechRecognitionLike>;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    onError("이 브라우저에서는 음성 인식이 지원되지 않습니다. 텍스트로 입력해 주세요.");
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? "";
    if (transcript) onResult(transcript);
  };
  recognition.onerror = () => {
    onError("음성 인식 중 문제가 발생했습니다. 마이크 권한을 확인하거나 텍스트로 입력해 주세요.");
    onEnd();
  };
  recognition.onend = () => {
    onEnd();
  };

  recognition.start();
  return () => {
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
