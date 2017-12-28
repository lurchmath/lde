
# Enhancements for Later

This page lists helpful enhancements to work already completed, but which
were not essential enough to have been included in the work done so far.  We
list them here so as not to lose track of important improvements we might
make later, and we leave empty check boxes next to them so that we can later
mark them complete as they are implemented.

 * [ ] Make the `labels()` function more efficient as follows.
    * Whenever it is computed, cache the value in an internal field.
    * The next time `labels()` is called, use the cached value if it exists.
    * Whenever you call `wasChanged()`, be sure to clear the cached value.
 * [ ] Make the `whatCitesMe()` function more efficient by making it loop
   manually through all the things in scope, tracking when anything in its
   scope eclipses it by being labeled with one or more of its labels.  If at
   any point it has no more labels left in force, stop iterating.  This is a
   minor performance gain, because it will be rare that a structure is fully
   eclipsed by other structures with the same name.
