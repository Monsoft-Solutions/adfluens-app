/**
 * Style Options Component
 *
 * Style, mood, and composition selectors for AI image generation.
 */

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

type StyleOptionsProps = {
  imageStyle?: string;
  onImageStyleChange: (value: string | undefined) => void;
  imageMood?: string;
  onImageMoodChange: (value: string | undefined) => void;
  imageComposition?: string;
  onImageCompositionChange: (value: string | undefined) => void;
};

const STYLE_OPTIONS = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "illustration", label: "Illustration" },
  { value: "3d-render", label: "3D Render" },
  { value: "flat-design", label: "Flat Design" },
  { value: "watercolor", label: "Watercolor" },
  { value: "cinematic", label: "Cinematic" },
];

const MOOD_OPTIONS = [
  { value: "vibrant", label: "Vibrant" },
  { value: "moody", label: "Moody" },
  { value: "professional", label: "Professional" },
  { value: "playful", label: "Playful" },
  { value: "calm", label: "Calm" },
  { value: "luxurious", label: "Luxurious" },
];

const COMPOSITION_OPTIONS = [
  { value: "closeup", label: "Close-up" },
  { value: "wide", label: "Wide Shot" },
  { value: "overhead", label: "Overhead" },
  { value: "centered", label: "Centered" },
  { value: "rule-of-thirds", label: "Rule of Thirds" },
];

export function StyleOptions({
  imageStyle,
  onImageStyleChange,
  imageMood,
  onImageMoodChange,
  imageComposition,
  onImageCompositionChange,
}: StyleOptionsProps) {
  const handleChange =
    (onChange: (value: string | undefined) => void) => (value: string) => {
      onChange(value === "auto" ? undefined : value);
    };

  return (
    <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 border">
      <StyleSelect
        label="Style"
        value={imageStyle}
        onChange={handleChange(onImageStyleChange)}
        options={STYLE_OPTIONS}
      />
      <StyleSelect
        label="Mood"
        value={imageMood}
        onChange={handleChange(onImageMoodChange)}
        options={MOOD_OPTIONS}
      />
      <StyleSelect
        label="Composition"
        value={imageComposition}
        onChange={handleChange(onImageCompositionChange)}
        options={COMPOSITION_OPTIONS}
      />
    </div>
  );
}

type StyleSelectProps = {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

function StyleSelect({ label, value, onChange, options }: StyleSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value || "auto"} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Auto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
