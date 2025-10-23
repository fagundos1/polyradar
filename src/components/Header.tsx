import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";

interface HeaderProps {
  walletAddress?: string;
  onConnectWallet: () => void;
  onDisconnect?: () => void;
  radarBalance?: number;
}

export default function Header({ 
  walletAddress, 
  onConnectWallet, 
  onDisconnect,
  radarBalance = 0 
}: HeaderProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {APP_LOGO && (
            <img 
              src={APP_LOGO} 
              alt={APP_TITLE} 
              className="h-8 w-8"
            />
          )}
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {APP_TITLE}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {walletAddress ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-950/50 border border-purple-900/50">
                <span className="text-sm font-mono text-purple-400">{radarBalance}</span>
                <span className="text-xs text-gray-400">RADAR</span>
              </div>
              <Button
                variant="outline"
                onClick={onDisconnect}
                className="font-mono text-sm"
              >
                {truncateAddress(walletAddress)}
              </Button>
            </>
          ) : (
            <Button
              onClick={onConnectWallet}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

