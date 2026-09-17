import { FlaskConical, Info } from 'lucide-react';
import { SHOWCASE_DISCLOSURE } from '@/config/showcase';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ShowcaseNotice = () => (
  <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
        <FlaskConical className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {SHOWCASE_DISCLOSURE.label}
      </span>
      <span className="hidden h-3 w-px bg-border sm:block" />
      <span>
        {isSupabaseConfigured
          ? SHOWCASE_DISCLOSURE.summary
          : 'Demo mode: simulated data (live feeds not configured)'}
      </span>
    </div>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex w-fit items-center gap-1 text-muted-foreground transition-colors hover:text-foreground" aria-label="About showcase data">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          How data works
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-5">
        {SHOWCASE_DISCLOSURE.detail}
      </TooltipContent>
    </Tooltip>
  </div>
);

export default ShowcaseNotice;
