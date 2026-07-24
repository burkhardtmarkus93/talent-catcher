alter table public.observations
drop constraint if exists fk_observations_resulting_report;

alter table public.observations
add constraint fk_observations_resulting_report
foreign key (resulting_report_id) references public.scout_reports(id);