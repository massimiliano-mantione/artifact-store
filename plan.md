
Execution modes

Source and destination are always repositories, unless where it is specified that they are regular directories (dir tree) or repository directories (repo dir).
Every command reads from *source* and modifies *destination*.

archive
  source (dir tree)
  repository
  tag (string)
  tags-store (repository)
  Recursively walks *source* and stores everything in *destination*.
  Finally stores that resulting hash as *tag* in *tag-store*.

checkout
  source (repo dir)
  destination (dir tree)
  hash
  Creates a tree of directories and hardlinks into *directory*, recreating the file tree described by *hash*.

pull
  source
  destination
  hash
  Ensure that *destination* contains every entry necessary to eventually checkout *hash* (pulling the needed entries from *source*).

copy
  source
  destination
  Copy every entry from the *source* repository into the *destination* repository.
  If both are directories, creates hardlinks instead of file copies.

trim
  source
  destination
  Make sure that *destination* only contains entries that also *source* contains.

sync
  source
  destination
  Perform both a *trim* and a *copy* from *source* to *destination*.

cleanup
  repository (repo dir)
  Remove every entry in *repository* that is referenced only once (will only work on directories for now).


Building blocks


The repository implementation

We are implementing repositories without prototypes.
Each repository is a plain object containing the following properties (those with type "method" expects *this* to be the repository object):

- kind :: string
  In the beginning either 'dir', or 's3', more can be added later.
- data :: any
  Anything that should be used as "root" for the repository.
  The absolute path of the root dir for 'dir', or the s3 bucket url for s3...
- check :: method
  (hash :: string) -> Promise<bool>
  Checks if *hash* is present in the repository.
- file :: method
  (hash :: string) -> string | null
  If possible (the repository is a directory) returns the absolute path and filename to the entry specified by *hash*. Otherwise returns *null*.
- read :: method
  (hash :: string) -> stream.Readable | null
  Reads *hash* from the repository.
  Returns a readable stream, or null if the hash is not found.
- write :: method
  (hash :: string, data :: string | stream.Readable) -> Promise<bool>
  Writes an entry in the repository.
  Strings are written with UTF8 encoding.
  The promise resolves when the write is done (it resolves to *true* if an entry has been actually added to the repository).
- write-file :: method
  (hash :: string, path :: string) -> Promise<bool>
  Writes an entry in the repository taking it from the file system.
  If possible create a hardlink, otherwise copy it into the repository.
  The promise resolves to *true* if an entry has been actually added to the repository.
- for-each :: method
  (hash :: string -> Promise<>) -> Promise<>
  For each repository entry, invoke the provided callback passing the entry hash as argument. The returned promise resolves when all the promises returned by the callbacks have resolved.


The above methods are the basic building blocks that implement a repository (the "core", similar to the plumbing in git).
Higher level functions can be written that take repositories as arguments, but their implementation should not depend on repository internals (they should just invoke the core methods).



Specification of directory encoding

Each directory is a string (encoded in UTF8), which is a list of entry descriptions separated by '/' symbols (the symbol has been chosen because it is illegal in file names.)

Each entry description is a fixed set of properties separated by ':' symbols (it has been chosen because it is illegal in every property except the last one):
- kind: one of 'f', 'x', 'l' or 'd' (for "FILE", "EXE", "LINK", or "DIR")
- hash: the entry hash as string
- name: the entry name as string

Entries are sorted lexicographically (this is needed to make hashing deterministic).
An empty directory is naturally described by the empty string.

This makes it trivial to build and parse directory and entry descriptions using the standard split, join and sort Javascript functions.
