/**
 * Office Layout & Coordinate Mapping Configuration
 * 
 * You can customize the image source and exact percentage coordinates 
 * of all rooms, wall panels, desks, and heights here when changing background layouts.
 */

export interface PanelCoordinate {
  id: string;
  top: string;
  left: string;
  width?: string;
  height?: string;
  roomType: 'warroom' | 'web' | 'ai' | 'noc' | 'dormant';
  label?: string;
}

export interface OfficeLayoutTheme {
  id: string;
  name: string;
  imageSrc: string;
  aspectRatio: '16:9';
  containerWidth: number; // 1400px
  containerHeight: number; // 788px
  panels: {
    warroom: PanelCoordinate[];
    web: PanelCoordinate[];
    ai: PanelCoordinate[];
    infra: PanelCoordinate[];
    dormant: PanelCoordinate[];
  };
  serverRack: {
    top: string;
    left: string;
    label: string;
  };
  roomClickAreas: {
    warroom: { top: string; left: string; width: string; height: string };
    web: { top: string; left: string; width: string; height: string };
    ai: { top: string; left: string; width: string; height: string };
    infra: { top: string; left: string; width: string; height: string };
    dormant: { top: string; left: string; width: string; height: string };
  };
}

export const DEFAULT_OFFICE_LAYOUT: OfficeLayoutTheme = {
  id: 'cyberpunk-diorama-v1',
  name: 'Cyberpunk Command Center Diorama',
  imageSrc: '/room/room-office.png',
  aspectRatio: '16:9',
  containerWidth: 1400,
  containerHeight: 788,
  panels: {
    warroom: [
      { id: 'war-1', top: '16%', left: '38.1%', width: '120px', height: '65px', roomType: 'warroom' },
      { id: 'war-2', top: '16%', left: '51.1%', width: '120px', height: '65px', roomType: 'warroom' },
      { id: 'war-3', top: '16%', left: '63.8%', width: '120px', height: '65px', roomType: 'warroom' },
    ],
    web: [
      { id: 'web-1', top: '42.5%', left: '12.4%', width: '102px', height: '58px', roomType: 'web' },
      { id: 'web-2', top: '42.5%', left: '19.9%', width: '102px', height: '58px', roomType: 'web' },
      { id: 'web-3', top: '42.5%', left: '27.4%', width: '102px', height: '58px', roomType: 'web' },
    ],
    ai: [
      { id: 'ai-1', top: '43.0%', left: '40.6%', width: '108px', height: '58px', roomType: 'ai' },
      { id: 'ai-2', top: '43.0%', left: '48.6%', width: '108px', height: '58px', roomType: 'ai' },
      { id: 'ai-3', top: '43.0%', left: '56.6%', width: '108px', height: '58px', roomType: 'ai' },
    ],
    infra: [
      { id: 'noc-1', top: '43.0%', left: '70.2%', width: '108px', height: '58px', roomType: 'noc' },
      { id: 'noc-2', top: '43.0%', left: '77.8%', width: '108px', height: '58px', roomType: 'noc' },
    ],
    dormant: [
      { id: 'sofa-1', top: '77.8%', left: '15.5%', width: '124px', height: '58px', roomType: 'dormant' },
      { id: 'sofa-2', top: '77.8%', left: '28.8%', width: '124px', height: '58px', roomType: 'dormant' },
      { id: 'sofa-3', top: '77.8%', left: '42.5%', width: '124px', height: '58px', roomType: 'dormant' },
      { id: 'sofa-4', top: '77.8%', left: '55.8%', width: '124px', height: '58px', roomType: 'dormant' },
      { id: 'sofa-5', top: '77.8%', left: '70.5%', width: '124px', height: '58px', roomType: 'dormant' },
      { id: 'sofa-6', top: '77.8%', left: '83.5%', width: '124px', height: '58px', roomType: 'dormant' },
    ],
  },
  serverRack: {
    top: '43.5%',
    left: '86.8%',
    label: 'K8s CLUSTER',
  },
  roomClickAreas: {
    warroom: { top: '4.5%', left: '34%', width: '32%', height: '6%' },
    web: { top: '33.5%', left: '8%', width: '25%', height: '5%' },
    ai: { top: '33.5%', left: '36%', width: '26%', height: '5%' },
    infra: { top: '33.5%', left: '64%', width: '27%', height: '5%' },
    dormant: { top: '63.5%', left: '8%', width: '25%', height: '5%' },
  },
};
