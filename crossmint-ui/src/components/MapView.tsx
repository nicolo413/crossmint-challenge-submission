import { MapPanel } from './MapPanel';

interface Props {
  candidateId: string;
  refreshKey: number;
}

export function MapView({ candidateId, refreshKey }: Props) {
  return (
    <div className="map-view">
      <MapPanel title="Current Map" candidateId={candidateId} type="current" refreshKey={refreshKey} />
      <MapPanel title="Goal Map" candidateId={candidateId} type="goal" refreshKey={refreshKey} />
    </div>
  );
}
