//src\app\bands\[bandId]\events\components\EventCalendar.tsx
import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';


interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

export default function EventCalendar() {
  const [events, setEvents] = useState<Event[]>([]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = prompt('Please enter event title');
    if (!title) return;

    const newEvent: Event = {
      id: String(Date.now()),
      title,
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay
    };

    setEvents([...events, newEvent]);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm('Delete this event?')) {
      setEvents(events.filter(event => event.id !== clickInfo.event.id));
    }
  };

  return (

<div className="relative">
      <ComingSoonOverlay message="Events Coming Soon!" />
      <div className="h-[calc(100vh-12rem)] bg-gray-800 rounded-lg p-4"></div>



    <div className="h-[calc(100vh-12rem)] bg-gray-800 rounded-lg p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        }}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        contentHeight="auto"
        height="100%"
        stickyHeaderDates={true}
        expandRows={true}
        themeSystem="standard"
      />
    </div>





    </div>
  );
}