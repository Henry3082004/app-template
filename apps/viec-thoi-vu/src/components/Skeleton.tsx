export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton" key={i}>
          <div className="sk" style={{ width: '60%', height: 16 }} />
          <div className="sk" style={{ width: '40%', height: 20 }} />
          <div className="sk" style={{ width: '85%' }} />
        </div>
      ))}
    </div>
  )
}
