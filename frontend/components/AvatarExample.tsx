import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function AvatarExample() {
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src="/avatar.png" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <span className="text-lg">John Doe</span>
    </div>
  );
}
