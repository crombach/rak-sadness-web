import "./Footer.scss";

export default function Footer() {
  return (
    <div className="footer">
      <a
        href="https://rakmadness.net/standings-pickem"
        target="_blank"
        rel="noreferrer"
      >
        🏆 Standings
      </a>
      |
      <a
        href="https://github.com/crombach/rak-sadness-web"
        target="_blank"
        rel="noreferrer"
      >
        🖥️ GitHub
      </a>
      |
      <a
        href="https://give.translifeline.org/give/461718/#!/donation/checkout"
        target="_blank"
        rel="noreferrer"
      >
        🏳️‍⚧️ Donate
      </a>
    </div>
  );
}
