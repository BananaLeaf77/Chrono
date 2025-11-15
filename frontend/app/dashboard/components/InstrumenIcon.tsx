import { Music, Piano, Guitar, Drum } from "lucide-react";  
import { PiGuitar } from "react-icons/pi";
import { 
  GiSaxophone, 
  GiTrumpet, 
  GiViolin,  
  GiMicrophone,
  GiDrum,       
  GiGuitarBassHead,
  GiFlute,
} from "react-icons/gi";

interface InstrumentIconProps {
  instrumentName: string;
  className?: string;
}

const InstrumenIcon: React.FC<InstrumentIconProps> = ({
  instrumentName = "",
  className = "w-6 h-6",
}) => {
  const name = (instrumentName || "").toLowerCase().trim();


  const iconMap = {
    // PIANO/KEYBOARD 
    piano: Piano,
    keyboard: Piano,

    // GITAR/GUITAR
    gitar: PiGuitar,      
    guitar: PiGuitar,
    guitars: PiGuitar,

    //Bass - REACT ICONS GI
    bass: GiGuitarBassHead,
    bassguitar: GiGuitarBassHead,

    // DRUM/PERKUSI - REACT ICONS GI (lebih detail)
    drum: Drum,
    Drum: GiDrum,
    perkusi: Drum,
    percussion: GiDrum,

    //Flute/seruling - REACT ICONS GI
    flute: GiFlute,
    seruling: GiFlute,
    suling: GiFlute,

    // VOCAL/MIC - REACT ICONS GI
    vokal: GiMicrophone,
    vocal: GiMicrophone,
    singing: GiMicrophone,
    mic: GiMicrophone,

    // SAXOPHONE - REACT ICONS GI
    saxophone: GiSaxophone,
    saksofon: GiSaxophone,

    // TRUMPET - REACT ICONS GI
    trumpet: GiTrumpet,
    terompet: GiTrumpet,

    // VIOLIN/BIOLA - REACT ICONS GI
    violin: GiViolin,
    biola: GiViolin,

    ukulele: Guitar,
    uke: Guitar,


    // STRING (umum) - LUCIDE (fallback)
    string: Music,
  };

  // Cari icon berdasarkan keyword yang cocok (prioritas urutan di object)
  const IconComponent = Object.entries(iconMap).find(([key]) => 
    name.includes(key)
  )?.[1] || Music;  // Default GI MusicalNotes

  return (
    <div className="inline-flex items-center justify-center">
      <IconComponent className={className} />
    </div>
  );
};

export default InstrumenIcon;