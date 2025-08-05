import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentTradesComponent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/01.png" alt="Avatar" />
          <AvatarFallback>AAPL</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Apple Inc.</p>
          <p className="text-sm text-muted-foreground">Long Position</p>
        </div>
        <div className="ml-auto font-medium text-green-600">+$1,999.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
          <AvatarImage src="/avatars/02.png" alt="Avatar" />
          <AvatarFallback>TSLA</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Tesla Inc.</p>
          <p className="text-sm text-muted-foreground">Short Position</p>
        </div>
        <div className="ml-auto font-medium text-red-600">-$39.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/03.png" alt="Avatar" />
          <AvatarFallback>MSFT</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Microsoft Corp.</p>
          <p className="text-sm text-muted-foreground">Long Position</p>
        </div>
        <div className="ml-auto font-medium text-green-600">+$299.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/04.png" alt="Avatar" />
          <AvatarFallback>GOOGL</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Alphabet Inc.</p>
          <p className="text-sm text-muted-foreground">Long Position</p>
        </div>
        <div className="ml-auto font-medium text-green-600">+$99.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/05.png" alt="Avatar" />
          <AvatarFallback>NVDA</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">NVIDIA Corp.</p>
          <p className="text-sm text-muted-foreground">Long Position</p>
        </div>
        <div className="ml-auto font-medium text-green-600">+$39.00</div>
      </div>
    </div>
  )
}
