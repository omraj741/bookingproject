import './StatCard.css'
const StatCard = ({title, value}) => {
  return (
    <article className="stat-card">
      <h3>{title}</h3>
      <p>{value}</p>
    </article>
  )
}

export default StatCard
