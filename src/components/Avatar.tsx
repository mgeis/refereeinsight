interface Props {
  url?: string | null;
  firstName: string;
  lastName: string;
  size: number;
}

export function Avatar({ url, firstName, lastName, size }: Props) {
  const initials = ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase();

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      background: "rgba(0,60,120,0.4)", border: "1px solid rgba(0,150,255,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: Math.max(9, size * 0.4), color: "rgba(140,180,220,0.6)", fontWeight: 600 }}>
          {initials}
        </span>
      )}
    </div>
  );
}
