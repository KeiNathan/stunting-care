export default function BalitaAvatar({ jenisKelamin, className }) {
  const src = jenisKelamin === 'M'
    ? '/balita-laki-laki.png'
    : '/balita-perempuan.png'

  return <img src={src} alt="" className={className} loading="lazy"/>
}
