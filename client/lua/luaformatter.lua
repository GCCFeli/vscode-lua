local function printerr(str)
  io.stderr:write(str)
end

-- Check interpreter version
if _VERSION ~= 'Lua 5.1' then
  printerr('Only compatible with Lua 5.1\n')
  return
end

local help = [[Formats Lua code.
  -s, --spaces (default 2) Spaces to use as indentation.
  -t, --tabs   (default 0) Tabulation(s) to use as indentation.
  -d, --delimiter (default unix) Type of new line to detect and use while formatting:
    * unix: '\n' LF Line feed.
    * windows: '\r\n' CR+LF
    * mac: '\r' CR Carriage Return of Macs before OSX.
  -h, --help This help.
  [files] Files to format.
]]
local lapp = require 'pl.lapp'
local args = lapp( help )

-- Print help
if not args or args.help then
  print( help )
  return
end

--
-- Check arguments
--
if #args == 0 then
  printerr 'No files to format.'
  return
elseif not (args.spaces or args.tabs) then
  -- Default indentation
  args.spaces = 2
end

-- Compute indentation sequence
local indentation
if args.tabs > 0 then
  -- Use tabs when asked
  local char = '\t'
  indentation = char:rep(args.tabs)
else
  -- Use spaces elseway
  local char = ' '
  indentation = char:rep(args.spaces)
end

-- End of line to use
local delimiters = {
  mac = '\r',
  unix = '\n',
  windows = '\r\n'
}
local delimiter = delimiters[ args.delimiter ]
if not delimiter then
  printerr( string.format('Unhandled delimiter: %s.', args.delimiter) )
  return
end

--
-- Output formatted file
--
local formatter = require 'formatter'
for _, filename in ipairs(args) do

  --
  -- Reading file
  --
  local file, err = io.open(filename, 'r')
  if not file then printerr( err ) return end
  
  local code, err = file:read('*a')
  if not code then printerr( err ) return end

  file:close()

  -- Handle UTF-8 BOM header
  if #code >= 3 and code:byte(1) == 239 and code:byte(2) == 187 and code:byte(3) == 191 then
    code = code:sub(4)
  end

  -- Format source
  local formatted, errormessage = formatter.indentcode(code, delimiter, true, indentation)
  if formatted then
    io.write(formatted)
  else
    printerr(string.format('Unable to format `%s`:\n%s', filename, errormessage))
  end
end
