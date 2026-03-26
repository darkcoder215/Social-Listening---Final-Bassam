import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder: string;
  buttonText?: string;
}

export default function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  inputValue,
  onInputChange,
  placeholder,
  buttonText = "أضف"
}: TagInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onAddTag()}
          className="text-base border-2"
        />
        <Button onClick={onAddTag} variant="outline" className="border-2 whitespace-nowrap">
          {buttonText}
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-base px-3 py-1">
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="mr-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}