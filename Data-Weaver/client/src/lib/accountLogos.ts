import radioThmanyahLogo from "@assets/راديو_ثمانية_logo_1769008600887.png";
import thmanyahLogo from "@assets/ثمانية_logo_1769008600891.png";
import livingThmanyahLogo from "@assets/معيشة_ثمانية_logo_1769008600892.jpg";
import sportsThmanyahLogo from "@assets/رياضة_ثمانية_logo_1769008600892.jpg";
import exitThmanyahLogo from "@assets/مخرج_ثمانية_logo_1769008607329.jpg";
import companyThmanyahLogo from "@assets/إذاعة_ثمانية_و_شركة_ثمانية_1769009403049.png";

const accountLogoMap: Record<string, string> = {
  radiothmanyah: radioThmanyahLogo,
  thmanyah: thmanyahLogo,
  thmanyahliving: livingThmanyahLogo,
  thmanyahsports: sportsThmanyahLogo,
  thmanyahexit: exitThmanyahLogo,
  "راديو ثمانية": radioThmanyahLogo,
  "ثمانية": thmanyahLogo,
  "معيشة ثمانية": livingThmanyahLogo,
  "رياضة ثمانية": sportsThmanyahLogo,
  "مخرج ثمانية": exitThmanyahLogo,
  "إذاعة ثمانية": companyThmanyahLogo,
  "شركة ثمانية": companyThmanyahLogo,
};

export function getAccountLogo(usernameOrName: string): string | undefined {
  const key = usernameOrName.toLowerCase().replace(/[_\s]/g, "");
  for (const [mapKey, logo] of Object.entries(accountLogoMap)) {
    if (mapKey.toLowerCase().replace(/[_\s]/g, "") === key) {
      return logo;
    }
  }
  if (usernameOrName.includes("radio") || usernameOrName.includes("راديو")) {
    return radioThmanyahLogo;
  }
  if (usernameOrName.includes("living") || usernameOrName.includes("معيشة")) {
    return livingThmanyahLogo;
  }
  if (usernameOrName.includes("sports") || usernameOrName.includes("رياضة")) {
    return sportsThmanyahLogo;
  }
  if (usernameOrName.includes("exit") || usernameOrName.includes("مخرج")) {
    return exitThmanyahLogo;
  }
  if (usernameOrName.includes("إذاعة") || usernameOrName.includes("شركة")) {
    return companyThmanyahLogo;
  }
  return thmanyahLogo;
}
